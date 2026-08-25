import React, { createContext, useContext, useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';
import {
  db,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type FirebaseUser,
} from '../lib/firebase';
import { cleanFirestoreData } from '../utils/cleanData';
import {
  BatchAssignPayload,
  CategoryItem,
  FilterState,
  HistoryEvent,
  LocationItem,
  MonthName,
  MonthlyBudget,
  ProblemTemplate,
  RiskLevel,
  ServiceItem,
  ServiceStatus,
  UserMember,
  UserRole,
  YesNoEmpty,
} from '../types';
import {
  calculateTMConsultation,
  getSpreadsheetClassification,
  mapKanbanToOfficialStatus,
  MONTH_NAMES,
  normalizeServiceStatus,
} from '../utils/priority';
import {
  INITIAL_CATEGORIES,
  INITIAL_LOCATIONS,
  INITIAL_MEMBERS,
  INITIAL_MONTHLY_BUDGETS,
  INITIAL_PROBLEM_TEMPLATES,
} from '../data/initialData';

interface MaintenanceContextType {
  services: ServiceItem[];
  categories: CategoryItem[];
  problemTemplates: ProblemTemplate[];
  locations: LocationItem[];
  members: UserMember[];
  monthlyBudgets: MonthlyBudget[];
  currentUser: UserMember;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  canEditServices: boolean;
  isAdmin: boolean;
  toggleMemberEditPermission: (memberId: string, canEdit: boolean) => Promise<void>;
  activeTab: string;
  filterState: FilterState;
  selectedService: ServiceItem | null;
  isNewServiceModalOpen: boolean;
  preselectedCategoryForNew?: string;
  safetyModalService: ServiceItem | null;
  isLoading: boolean;
  firebaseConnected: boolean;

  // Modal UI Triggers
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isUserManagementModalOpen: boolean;
  editingMemberForModal: UserMember | null;
  openUserManagementModal: (editingMember?: UserMember) => void;
  closeUserManagementModal: () => void;
  isProblemTemplatesModalOpen: boolean;
  openProblemTemplatesModal: () => void;
  closeProblemTemplatesModal: () => void;
  isBatchAssignModalOpen: boolean;
  batchAssignTargetIds: string[];
  openBatchAssignModal: (serviceIds?: string[]) => void;
  closeBatchAssignModal: () => void;

  // Auth Actions
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerWithEmail: (
    name: string,
    email: string,
    pass: string,
    role: UserRole,
    phone?: string,
    assignedCategories?: string[]
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;

  // Actions
  setActiveTab: (tab: string) => void;
  setCurrentUser: (user: UserMember) => void;
  switchUser: (member: UserMember) => void;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  openNewServiceModal: (preselectedCategory?: string) => void;
  closeNewServiceModal: () => void;
  selectService: (service: ServiceItem | null) => void;
  closeServiceDetail: () => void;
  openSafetyModal: (service: ServiceItem) => void;
  closeSafetyModal: () => void;
  confirmSafetyAndStart: (serviceId: string) => void;

  // Services
  addService: (data: Partial<ServiceItem>) => Promise<ServiceItem>;
  updateService: (id: string, updates: Partial<ServiceItem>) => Promise<void>;
  moveService: (
    id: string,
    newStatus: ServiceStatus,
    skipCheck?: boolean
  ) => { success: boolean; requiresSafetyCheck?: boolean };
  deleteService: (id: string) => Promise<void>;
  addHistoryEvent: (
    serviceId: string,
    action: string,
    details?: string,
    field?: string,
    oldValue?: string,
    newValue?: string
  ) => Promise<void>;
  batchAssignServices: (payload: BatchAssignPayload) => Promise<void>;
  batchCreateServicesFromTemplates: (
    templateIds: string[],
    targetData: {
      location?: string;
      executorName?: string;
      supervisorName?: string;
      dueDate?: string;
      forecastMonth?: string;
    }
  ) => Promise<void>;

  // Categories
  addCategory: (category: Omit<CategoryItem, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<CategoryItem>) => Promise<void>;
  toggleCategoryStatus: (id: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Problem Templates
  addProblemTemplate: (template: Omit<ProblemTemplate, 'id'>) => Promise<void>;
  updateProblemTemplate: (id: string, updates: Partial<ProblemTemplate>) => Promise<void>;
  deleteProblemTemplate: (id: string) => Promise<void>;
  seedPreFixedData: (force?: boolean) => Promise<void>;

  // Locations
  addLocation: (location: Omit<LocationItem, 'id'>) => Promise<void>;
  updateLocation: (id: string, updates: Partial<LocationItem>) => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;

  // Members
  addMember: (member: Omit<UserMember, 'id'>) => Promise<void>;
  addMembersBatch: (membersList: Omit<UserMember, 'id'>[]) => Promise<number>;
  updateMember: (id: string, updates: Partial<UserMember>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;

  // Budgets
  setMonthlyBudget: (month: string, ceilingAmount: number, notes?: string) => Promise<void>;
  getBudgetForMonth: (monthStr: string) => MonthlyBudget | undefined;

  // Clean / Backup & Restore
  clearDatabase: () => Promise<void>;
  exportDatabaseJSON: () => void;
  importDatabaseJSON: (jsonData: string) => Promise<boolean>;
  importSpreadsheetFile: (file: File) => Promise<boolean>;
}

export const INITIAL_FILTER_STATE: FilterState = {
  search: '',
  category: '',
  problem: '',
  responsible: '',
  supervisor: '',
  priority: '',
  risk: '',
  status: '',
  location: '',
  forecastMonth: '',
  onlyOverdue: false,
  onlyNeedsTM: false,
  onlyHighRisk: false,
};

const DUMMY_NAMES_LIST = [
  'joão silva',
  'joão',
  'carlos oliveira',
  'carlos souza',
  'carlos',
  'josé santos',
  'josé',
  'marcos souza',
  'marcos',
  'daniel costa',
  'daniel',
  'pedro lima',
  'paulo ribeiro',
  'paulo',
  'lucas ferreira',
  'lucas',
  'administrador do sistema',
];

export const isDummyPerson = (name?: string): boolean => {
  if (!name) return false;
  const n = name.toLowerCase().trim();
  return DUMMY_NAMES_LIST.includes(n);
};

const DEFAULT_ADMIN_USER: UserMember = {
  id: 'user-admin-default',
  name: 'Pedro Belchior',
  email: 'belchior87@gmail.com',
  role: 'ADMINISTRADOR',
  avatarColor: '#2563eb',
  assignedCategories: [],
  active: true,
};

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export const MaintenanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [problemTemplates, setProblemTemplates] = useState<ProblemTemplate[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [members, setMembers] = useState<UserMember[]>([]);
  const [monthlyBudgets, setMonthlyBudgets] = useState<MonthlyBudget[]>([]);

  // Auth State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserMember>(() => {
    try {
      const saved = localStorage.getItem('sr_current_user_v5');
      return saved ? JSON.parse(saved) : DEFAULT_ADMIN_USER;
    } catch {
      return DEFAULT_ADMIN_USER;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('kanban');
  const [filterState, setFilterState] = useState<FilterState>(INITIAL_FILTER_STATE);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState<boolean>(false);
  const [preselectedCategoryForNew, setPreselectedCategoryForNew] = useState<string | undefined>(undefined);
  const [safetyModalService, setSafetyModalService] = useState<ServiceItem | null>(null);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState<boolean>(false);
  const [editingMemberForModal, setEditingMemberForModal] = useState<UserMember | null>(null);
  const [isProblemTemplatesModalOpen, setIsProblemTemplatesModalOpen] = useState<boolean>(false);
  const [isBatchAssignModalOpen, setIsBatchAssignModalOpen] = useState<boolean>(false);
  const [batchAssignTargetIds, setBatchAssignTargetIds] = useState<string[]>([]);

  // Track Firebase Auth state changes
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        const userEmail = (user.email || '').toLowerCase().trim();
        const found = members.find(
          (m) => (m.email && m.email.toLowerCase().trim() === userEmail) || (m.uid && m.uid === user.uid) || m.id === user.uid
        );
        if (found) {
          setCurrentUser(found);
          try {
            localStorage.setItem('sr_current_user_v5', JSON.stringify(found));
            localStorage.setItem('active_user_id', found.id);
          } catch {
            // Ignore localStorage errors
          }
        }
      }
    });

    return () => unsubAuth();
  }, [members]);

  // Firestore Real-Time Subscriptions
  useEffect(() => {
    setIsLoading(true);

    const unsubServices = onSnapshot(
      collection(db, 'services'),
      (snap) => {
        const items: ServiceItem[] = [];
        for (const docSnap of snap.docs) {
          const raw = docSnap.data() as ServiceItem;
          let changed = false;
          const updates: Partial<ServiceItem> = {};

          const normStatus = normalizeServiceStatus(raw.status);
          if (raw.status !== normStatus) {
            updates.status = normStatus;
            updates.officialStatus = mapKanbanToOfficialStatus(normStatus);
            changed = true;
          }

          let resp = raw.responsibleName || '';
          if (isDummyPerson(resp)) {
            resp = 'Pedro Belchior';
            updates.responsibleName = resp;
            changed = true;
          }

          let exec = raw.executorName || '';
          if (isDummyPerson(exec) || !exec) {
            exec = resp || 'Pedro Belchior';
            updates.executorName = exec;
            updates.assignedMember = exec;
            changed = true;
          }

          if (isDummyPerson(raw.supervisorName)) {
            updates.supervisorName = '';
            updates.supervisorNames = [];
            updates.supervisorId = '';
            updates.supervisorIds = [];
            changed = true;
          }

          if (changed) {
            updateDoc(doc(db, 'services', docSnap.id), cleanFirestoreData(updates)).catch(console.error);
          }

          items.push({
            ...raw,
            ...updates,
            id: docSnap.id,
          });
        }
        items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setServices(items);
        setIsLoading(false);
      },
      (err) => {
        console.error('Firestore services listener error:', err);
        setFirebaseConnected(false);
        setIsLoading(false);
      }
    );

    const unsubCategories = onSnapshot(
      collection(db, 'categories'),
      (snap) => {
        const items = snap.docs.map((docSnap) => {
          const cat = docSnap.data() as CategoryItem;
          if (isDummyPerson(cat.defaultResponsibleName) || /^user-[1-8]$/.test(cat.defaultResponsibleId || '')) {
            updateDoc(doc(db, 'categories', docSnap.id), {
              defaultResponsibleName: '',
              defaultResponsibleId: '',
            }).catch(console.error);
            return { ...cat, defaultResponsibleName: '', defaultResponsibleId: '', id: docSnap.id };
          }
          return { ...cat, id: docSnap.id };
        });
        setCategories(items);
      },
      (err) => console.error('Firestore categories listener error:', err)
    );

    const unsubProblems = onSnapshot(
      collection(db, 'problemTemplates'),
      (snap) => {
        const items = snap.docs.map((docSnap) => {
          const prob = docSnap.data() as ProblemTemplate;
          if (isDummyPerson(prob.defaultResponsible)) {
            updateDoc(doc(db, 'problemTemplates', docSnap.id), {
              defaultResponsible: '',
            }).catch(console.error);
            return { ...prob, defaultResponsible: '', id: docSnap.id };
          }
          return { ...prob, id: docSnap.id };
        });
        setProblemTemplates(items);
      },
      (err) => console.error('Firestore problemTemplates listener error:', err)
    );

    const unsubLocations = onSnapshot(
      collection(db, 'locations'),
      (snap) => {
        const items = snap.docs.map((docSnap) => ({
          ...(docSnap.data() as LocationItem),
          id: docSnap.id,
        }));
        setLocations(items);
      },
      (err) => console.error('Firestore locations listener error:', err)
    );

    const unsubMembers = onSnapshot(
      collection(db, 'members'),
      (snap) => {
        const rawMembers: UserMember[] = [];
        for (const docSnap of snap.docs) {
          const m = docSnap.data() as UserMember;
          const isLegacyDummy =
            (/^user-[1-8]$/.test(docSnap.id) ||
              isDummyPerson(m.name) ||
              (m.email && m.email.endsWith('@salao.org'))) &&
            !m.uid;

          if (isLegacyDummy) {
            deleteDoc(doc(db, 'members', docSnap.id)).catch(console.error);
          } else {
            rawMembers.push({ ...m, id: docSnap.id });
          }
        }

        // Keep all members, deduping only if real authenticated accounts share the exact same email
        const memberMap = new Map<string, UserMember>();
        for (const m of rawMembers) {
          const isRealAuthEmail =
            m.email &&
            !m.email.includes('@interno.app') &&
            m.email.includes('@') &&
            !m.email.endsWith('@salao.org');
          const key = isRealAuthEmail ? `email:${m.email.toLowerCase().trim()}` : `id:${m.id}`;
          const existing = memberMap.get(key);
          if (!existing) {
            memberMap.set(key, m);
          } else {
            if (m.role === 'ADMINISTRADOR' && existing.role !== 'ADMINISTRADOR') {
              memberMap.set(key, m);
            }
          }
        }
        const realMembers = Array.from(memberMap.values());

        // If no members exist yet in Firestore, ensure Pedro Belchior is established as ADMINISTRADOR
        if (realMembers.length === 0) {
          const defaultMember: UserMember = {
            id: 'user-pedro-belchior',
            name: 'Pedro Belchior',
            email: 'belchior87@gmail.com',
            role: 'ADMINISTRADOR',
            avatarColor: '#2563eb',
            assignedCategories: [],
            active: true,
            canEdit: true,
          };
          setDoc(doc(db, 'members', defaultMember.id), defaultMember).catch(console.error);
          realMembers.push(defaultMember);
        }

        // If an authenticated user is logged in, ensure their record exists in Firestore
        const activeAuthUser = auth.currentUser;
        if (activeAuthUser) {
          const authEmail = (activeAuthUser.email || '').toLowerCase().trim();
          const existingAuthMember = realMembers.find(
            (m) =>
              (m.email && m.email.toLowerCase().trim() === authEmail) ||
              (m.uid && m.uid === activeAuthUser.uid) ||
              m.id === activeAuthUser.uid
          );

          if (!existingAuthMember && authEmail) {
            const isUserAdmin = authEmail === 'belchior87@gmail.com';
            const newMember: UserMember = {
              id: `user-${activeAuthUser.uid.slice(0, 8)}`,
              uid: activeAuthUser.uid,
              name: activeAuthUser.displayName || authEmail.split('@')[0] || 'Usuário Salão',
              email: authEmail,
              photoURL: activeAuthUser.photoURL || undefined,
              role: isUserAdmin ? 'ADMINISTRADOR' : 'COORDENADOR',
              avatarColor: '#2563eb',
              assignedCategories: [],
              active: true,
              canEdit: isUserAdmin ? true : false,
            };
            setDoc(doc(db, 'members', newMember.id), newMember).catch(console.error);
            realMembers.push(newMember);
          }
        }

        setMembers(realMembers);

        setCurrentUser((prev) => {
          if (activeAuthUser) {
            const authEmail = (activeAuthUser.email || '').toLowerCase().trim();
            const matchedAuth = realMembers.find(
              (m) =>
                (m.email && m.email.toLowerCase().trim() === authEmail) ||
                (m.uid && m.uid === activeAuthUser.uid) ||
                m.id === activeAuthUser.uid
            );
            if (matchedAuth) {
              try {
                localStorage.setItem('sr_current_user_v5', JSON.stringify(matchedAuth));
                localStorage.setItem('active_user_id', matchedAuth.id);
              } catch {
                // Ignore
              }
              return matchedAuth;
            }
          }

          const savedActiveId = localStorage.getItem('active_user_id');
          if (savedActiveId) {
            const foundById = realMembers.find((m) => m.id === savedActiveId);
            if (foundById) return foundById;
          }

          if (isDummyPerson(prev.name) || prev.id.startsWith('user-admin-default')) {
            const adminOrFirst = realMembers.find((m) => m.email === 'belchior87@gmail.com') || realMembers[0];
            return adminOrFirst;
          }

          const found = realMembers.find(
            (m) =>
              m.id === prev.id ||
              (prev.email && m.email && m.email.toLowerCase().trim() === prev.email.toLowerCase().trim())
          );
          return found || realMembers[0];
        });
      },
      (err) => console.error('Firestore members listener error:', err)
    );

    const unsubBudgets = onSnapshot(
      collection(db, 'monthlyBudgets'),
      (snap) => {
        const items = snap.docs.map((docSnap) => ({
          ...(docSnap.data() as MonthlyBudget),
          month: docSnap.id,
        }));
        setMonthlyBudgets(items);
      },
      (err) => console.error('Firestore budgets listener error:', err)
    );

    return () => {
      unsubServices();
      unsubCategories();
      unsubProblems();
      unsubLocations();
      unsubMembers();
      unsubBudgets();
    };
  }, []);

  // Save currentUser locally
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('sr_current_user_v5', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  // Keep selectedService in sync with updated services
  useEffect(() => {
    if (selectedService) {
      const updated = services.find((s) => s.id === selectedService.id);
      if (updated) {
        setSelectedService(updated);
      }
    }
  }, [services]);

  // Auth Operations
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userEmail = (user.email || '').toLowerCase().trim();
      const existing = members.find((m) => m.email.toLowerCase().trim() === userEmail || m.uid === user.uid);

      if (existing) {
        setCurrentUser(existing);
      } else {
        const newMember: UserMember = {
          id: `user-${user.uid.slice(0, 8)}`,
          uid: user.uid,
          name: user.displayName || userEmail.split('@')[0] || 'Usuário Google',
          email: userEmail,
          photoURL: user.photoURL || undefined,
          role: 'COORDENADOR',
          avatarColor: '#2563eb',
          assignedCategories: [],
          active: true,
        };
        await setDoc(doc(db, 'members', newMember.id), newMember);
        setCurrentUser(newMember);
      }
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      console.error('Google login error:', err);
      return { success: false, error: err.message || 'Erro ao autenticar com a conta Google' };
    }
  };

  const loginWithEmail = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const user = result.user;
      const userEmail = (user.email || '').toLowerCase().trim();
      const existing = members.find((m) => m.email.toLowerCase().trim() === userEmail || m.uid === user.uid);

      if (existing) {
        setCurrentUser(existing);
      } else {
        const newMember: UserMember = {
          id: `user-${user.uid.slice(0, 8)}`,
          uid: user.uid,
          name: user.displayName || userEmail.split('@')[0],
          email: userEmail,
          role: 'RESPONSÁVEL',
          avatarColor: '#2563eb',
          assignedCategories: [],
          active: true,
        };
        await setDoc(doc(db, 'members', newMember.id), newMember);
        setCurrentUser(newMember);
      }
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      console.error('Email login error:', err);
      let errorMsg = 'Credenciais inválidas ou usuário não cadastrado.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMsg = 'Senha incorreta ou email não corresponde.';
      } else if (err.code === 'auth/user-not-found') {
        errorMsg = 'Nenhum usuário cadastrado com este e-mail.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Formato de e-mail inválido.';
      }
      return { success: false, error: errorMsg };
    }
  };

  const registerWithEmail = async (
    name: string,
    email: string,
    pass: string,
    role: UserRole,
    phone?: string,
    assignedCategories: string[] = []
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const user = result.user;
      await updateProfile(user, { displayName: name.trim() });

      const isUserAdmin = email.trim().toLowerCase() === 'belchior87@gmail.com' || role === 'ADMINISTRADOR';
      const newMember: UserMember = {
        id: `user-${user.uid.slice(0, 8)}`,
        uid: user.uid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || '',
        role: role || 'RESPONSÁVEL',
        avatarColor: ['#0284c7', '#7c3aed', '#d97706', '#0d9488', '#2563eb', '#dc2626'][
          Math.floor(Math.random() * 6)
        ],
        assignedCategories: assignedCategories || [],
        active: true,
        canEdit: isUserAdmin ? true : false,
      };

      await setDoc(doc(db, 'members', newMember.id), newMember);
      setCurrentUser(newMember);
      setIsAuthModalOpen(false);
      return { success: true };
    } catch (err: any) {
      console.error('Registration error:', err);
      let errorMsg = 'Erro ao criar conta.';
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'Este e-mail já está cadastrado no sistema.';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'A senha deve ter pelo menos 6 caracteres.';
      }
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setFirebaseUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Seed Pre-fixed Data (19 Categories, 36 Technical Problem Templates & Solutions, 16 Locations)
  const seedPreFixedData = async (force: boolean = false) => {
    if (categories.length === 0 || force) {
      for (const cat of INITIAL_CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.id), cat);
      }
    }

    if (problemTemplates.length === 0 || force) {
      for (const prob of INITIAL_PROBLEM_TEMPLATES) {
        await setDoc(doc(db, 'problemTemplates', prob.id), prob);
      }
    }

    if (locations.length === 0 || force) {
      for (const loc of INITIAL_LOCATIONS) {
        await setDoc(doc(db, 'locations', loc.id), loc);
      }
    }

    if (members.length === 0 || force) {
      for (const mbr of INITIAL_MEMBERS) {
        await setDoc(doc(db, 'members', mbr.id), mbr);
      }
    }

    if (monthlyBudgets.length === 0 || force) {
      for (const bgt of INITIAL_MONTHLY_BUDGETS) {
        await setDoc(doc(db, 'monthlyBudgets', bgt.month), bgt);
      }
    }
  };

  const resetFilters = () => setFilterState(INITIAL_FILTER_STATE);

  const isAdmin = Boolean(
    (currentUser.email && currentUser.email.toLowerCase().trim() === 'belchior87@gmail.com') ||
      currentUser.role === 'ADMINISTRADOR' ||
      (firebaseUser && firebaseUser.email && firebaseUser.email.toLowerCase().trim() === 'belchior87@gmail.com')
  );

  const canEditServices = Boolean(isAdmin || currentUser.canEdit === true);

  const toggleMemberEditPermission = async (memberId: string, canEdit: boolean) => {
    await updateMember(memberId, { canEdit });
  };

  const openNewServiceModal = (preselectedCategory?: string) => {
    setPreselectedCategoryForNew(preselectedCategory);
    setIsNewServiceModalOpen(true);
  };

  const closeNewServiceModal = () => {
    setPreselectedCategoryForNew(undefined);
    setIsNewServiceModalOpen(false);
  };

  const selectService = (service: ServiceItem | null) => {
    setSelectedService(service);
  };

  const closeServiceDetail = () => {
    setSelectedService(null);
  };

  const openSafetyModal = (service: ServiceItem) => {
    setSafetyModalService(service);
  };

  const closeSafetyModal = () => {
    setSafetyModalService(null);
  };

  const confirmSafetyAndStart = async (serviceId: string) => {
    const today = new Date().toISOString();
    await updateService(serviceId, {
      status: 'EM ANDAMENTO',
      safetyChecklistConfirmed: true,
      safetyConfirmedBy: currentUser.name,
      safetyConfirmedAt: today,
    });
    await addHistoryEvent(
      serviceId,
      'Segurança Validada',
      `Checklist de EPI validado por ${currentUser.name} (${currentUser.role}). Trabalho em altura/alto risco autorizado.`
    );
    setSafetyModalService(null);
  };

  const getBudgetForMonth = (monthStr: string): MonthlyBudget | undefined => {
    return monthlyBudgets.find((b) => b.month === monthStr);
  };

  const getNextServiceCode = () => {
    const year = new Date().getFullYear();
    const count = services.length + 1;
    return `SR-${year}-${String(count).padStart(3, '0')}`;
  };

  // Modals management
  const openUserManagementModal = (editingMember?: UserMember) => {
    setEditingMemberForModal(editingMember || null);
    setIsUserManagementModalOpen(true);
  };

  const closeUserManagementModal = () => {
    setEditingMemberForModal(null);
    setIsUserManagementModalOpen(false);
  };

  const openProblemTemplatesModal = () => {
    setIsProblemTemplatesModalOpen(true);
  };

  const closeProblemTemplatesModal = () => {
    setIsProblemTemplatesModalOpen(false);
  };

  const openBatchAssignModal = (serviceIds?: string[]) => {
    setBatchAssignTargetIds(serviceIds || []);
    setIsBatchAssignModalOpen(true);
  };

  const closeBatchAssignModal = () => {
    setBatchAssignTargetIds([]);
    setIsBatchAssignModalOpen(false);
  };

  const switchUser = (member: UserMember) => {
    setCurrentUser(member);
    try {
      localStorage.setItem('active_user_id', member.id);
      localStorage.setItem('sr_current_user_v5', JSON.stringify(member));
    } catch {
      // Ignore localStorage errors
    }
  };

  // Service Management in Firebase
  const addService = async (data: Partial<ServiceItem>): Promise<ServiceItem> => {
    const risk: RiskLevel = (data.risk || 3) as RiskLevel;
    const classification = getSpreadsheetClassification(risk);

    const now = new Date().toISOString();
    const todayDate = now.split('T')[0];
    const currentMonth = todayDate.substring(0, 7);
    const forecastMonth = data.forecastMonth || currentMonth;

    let highRiskWork: YesNoEmpty = '';
    if (data.highRiskWork !== undefined && data.highRiskWork !== null) {
      highRiskWork = data.highRiskWork;
    } else if (data.isHighRisk !== undefined) {
      highRiskWork = data.isHighRisk ? 'Sim' : 'Não';
    }

    const estimatedCost = Number(data.estimatedCost) || 0;
    const monthBudget = getBudgetForMonth(forecastMonth);
    const ceiling = monthBudget ? monthBudget.ceilingAmount : 0;
    const tmCalc = calculateTMConsultation(highRiskWork, estimatedCost, ceiling);

    const stage: ServiceStatus = data.status || 'NOVOS PROBLEMAS';
    const officialStatus = mapKanbanToOfficialStatus(stage);

    const monthIndex = parseInt(forecastMonth.split('-')[1] || '1', 10) - 1;
    const executionMonthName: MonthName =
      data.executionMonthName || (monthIndex >= 0 && monthIndex < 12 ? MONTH_NAMES[monthIndex] : 'Agosto');

    const responsibleNames: string[] =
      data.responsibleNames && data.responsibleNames.length > 0
        ? data.responsibleNames
        : data.responsibleName
        ? data.responsibleName.split(',').map((s) => s.trim()).filter(Boolean)
        : [currentUser.name];

    const responsibleIds: string[] =
      data.responsibleIds && data.responsibleIds.length > 0
        ? data.responsibleIds
        : data.responsibleId
        ? [data.responsibleId]
        : responsibleNames.map((rn) => members.find((m) => m.name === rn)?.id || currentUser.id);

    const responsibleName = data.responsibleName || responsibleNames.join(', ');

    const executorNames: string[] =
      data.executorNames && data.executorNames.length > 0
        ? data.executorNames
        : data.executorName
        ? data.executorName.split(',').map((s) => s.trim()).filter(Boolean)
        : [responsibleName];

    const executorIds: string[] =
      data.executorIds && data.executorIds.length > 0
        ? data.executorIds
        : executorNames.map((en) => members.find((m) => m.name === en)?.id || '').filter(Boolean);

    const executorName = data.executorName || executorNames.join(', ');

    const newId = `serv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newService: ServiceItem = {
      id: newId,
      code: data.code || getNextServiceCode(),
      title: data.title || data.problem || 'Serviço de Manutenção',
      category: data.category || (categories[0]?.name ?? 'Geral'),
      problem: data.problem || '',
      description: data.description || '',
      location: data.location || (locations[0]?.name ?? 'Auditório Principal'),
      recommendedSolution: data.recommendedSolution || '',

      gravity: classification.gravityLevel,
      gravityText: classification.gravityText,
      urgency: classification.urgencyLevel,
      urgencyText: classification.urgencyText,
      trend: classification.trendLevel,
      trendText: classification.trendText,
      priorityScore: classification.score,
      priority: classification.priority,

      risk,
      responsibleId: responsibleIds[0] || currentUser.id,
      responsibleName,
      responsibleIds,
      responsibleNames,
      executorName,
      executorIds,
      executorNames,
      supervisorId: data.supervisorId || '',
      supervisorName: data.supervisorName || '',
      supervisorIds: data.supervisorIds || (data.supervisorId ? [data.supervisorId] : []),
      supervisorNames: data.supervisorNames || (data.supervisorName ? [data.supervisorName] : []),
      team: data.team || '',
      assignedMember: executorName,

      identifiedDate: data.identifiedDate || todayDate,
      forecastMonth,
      executionMonthName,
      dueDate: data.dueDate || todayDate,
      status: stage,
      officialStatus,

      estimatedCost,
      approvedCost: Number(data.approvedCost) || 0,
      actualCost: Number(data.actualCost) || 0,

      highRiskWork,
      isHighRisk: highRiskWork === 'Sim',
      needsTMOption: tmCalc.needsTMOption,
      needsTM: tmCalc.needsTM,
      tmStatus: tmCalc.needsTM ? data.tmStatus || 'Não iniciado' : undefined,
      safetyChecklistConfirmed: Boolean(data.safetyChecklistConfirmed),
      safetyConfirmedBy: data.safetyConfirmedBy,
      safetyConfirmedAt: data.safetyConfirmedAt,

      notes: data.notes || '',
      attachments: data.attachments || [],
      history: [
        {
          id: `hist-${Date.now()}`,
          timestamp: now,
          userName: currentUser.name,
          action: 'Registrou novo problema',
          details: `Registrado na categoria "${data.category || 'Geral'}" com Risco ${risk} e Prioridade ${classification.priority}.`,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    // Optimistic UI update
    setServices((prev) => [newService, ...prev.filter((s) => s.id !== newId)]);

    const cleanedPayload = cleanFirestoreData(newService);
    await setDoc(doc(db, 'services', newId), cleanedPayload);
    return newService;
  };

  const updateService = async (id: string, updates: Partial<ServiceItem>): Promise<void> => {
    const target = services.find((s) => s.id === id);
    if (!target) return;

    const now = new Date().toISOString();
    const historyEntries: HistoryEvent[] = [...(target.history || [])];

    const newRisk: RiskLevel = updates.risk !== undefined ? updates.risk : target.risk;
    const classification = getSpreadsheetClassification(newRisk);

    let newHighRiskWork: YesNoEmpty = target.highRiskWork;
    if (updates.highRiskWork !== undefined) {
      newHighRiskWork = updates.highRiskWork;
    } else if (updates.isHighRisk !== undefined) {
      newHighRiskWork = updates.isHighRisk ? 'Sim' : 'Não';
    }

    const newEstimatedCost = updates.estimatedCost !== undefined ? Number(updates.estimatedCost) : target.estimatedCost;
    const newForecastMonth = updates.forecastMonth || target.forecastMonth;
    const monthBudget = getBudgetForMonth(newForecastMonth);
    const ceiling = monthBudget ? monthBudget.ceilingAmount : 0;
    const tmCalc = calculateTMConsultation(newHighRiskWork, newEstimatedCost, ceiling);

    const newStatus = updates.status || target.status;
    const newOfficialStatus = mapKanbanToOfficialStatus(newStatus);

    let newMonthName = target.executionMonthName;
    if (updates.executionMonthName) {
      newMonthName = updates.executionMonthName;
    } else if (updates.forecastMonth && updates.forecastMonth !== target.forecastMonth) {
      const monthIndex = parseInt(updates.forecastMonth.split('-')[1] || '1', 10) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        newMonthName = MONTH_NAMES[monthIndex];
      }
    }

    if (updates.status && updates.status !== target.status) {
      historyEntries.unshift({
        id: `hist-${Date.now()}-${Math.random()}`,
        timestamp: now,
        userName: currentUser.name,
        action: `Alterou status: "${target.status}" → "${updates.status}"`,
        field: 'status',
        oldValue: target.status,
        newValue: updates.status,
      });
    }

    if (updates.supervisorName && updates.supervisorName !== target.supervisorName) {
      historyEntries.unshift({
        id: `hist-${Date.now()}-${Math.random()}`,
        timestamp: now,
        userName: currentUser.name,
        action: `Designou supervisor: ${target.supervisorName || 'Nenhum'} → ${updates.supervisorName}`,
        field: 'supervisorName',
        oldValue: target.supervisorName,
        newValue: updates.supervisorName,
      });
    }

    if (updates.executorName && updates.executorName !== target.executorName) {
      historyEntries.unshift({
        id: `hist-${Date.now()}-${Math.random()}`,
        timestamp: now,
        userName: currentUser.name,
        action: `Designou executor: ${target.executorName || 'Nenhum'} → ${updates.executorName}`,
        field: 'executorName',
        oldValue: target.executorName,
        newValue: updates.executorName,
      });
    }

    const payload: Partial<ServiceItem> = {
      ...updates,
      risk: newRisk,
      gravity: classification.gravityLevel,
      gravityText: classification.gravityText,
      urgency: classification.urgencyLevel,
      urgencyText: classification.urgencyText,
      trend: classification.trendLevel,
      trendText: classification.trendText,
      priorityScore: classification.score,
      priority: classification.priority,
      highRiskWork: newHighRiskWork,
      isHighRisk: newHighRiskWork === 'Sim',
      needsTMOption: tmCalc.needsTMOption,
      needsTM: tmCalc.needsTM,
      forecastMonth: newForecastMonth,
      executionMonthName: newMonthName,
      status: newStatus,
      officialStatus: newOfficialStatus,
      history: historyEntries,
      updatedAt: now,
    };

    if (updates.status === 'CONCLUÍDO' && !target.completedDate) {
      payload.completedDate = now.split('T')[0];
    }

    // Optimistic UI updates
    setServices((prev) =>
      prev.map((s) => (s.id === id ? ({ ...s, ...payload } as ServiceItem) : s))
    );
    if (selectedService?.id === id) {
      setSelectedService((prev) => (prev ? ({ ...prev, ...payload } as ServiceItem) : null));
    }

    const cleanedPayload = cleanFirestoreData(payload);
    await updateDoc(doc(db, 'services', id), cleanedPayload);
  };

  const batchAssignServices = async (payload: BatchAssignPayload) => {
    const { serviceIds, executorName, supervisorName, supervisorId, status, dueDate } = payload;
    const now = new Date().toISOString();

    for (const sId of serviceIds) {
      const target = services.find((s) => s.id === sId);
      if (!target) continue;

      const historyEntries = [...(target.history || [])];
      const updates: Partial<ServiceItem> = { updatedAt: now };

      if (executorName) {
        updates.executorName = executorName;
        updates.assignedMember = executorName;
        historyEntries.unshift({
          id: `hist-${Date.now()}-${Math.random()}`,
          timestamp: now,
          userName: currentUser.name,
          action: `Designação em massa: Executor alterado para ${executorName}`,
        });
      }

      if (supervisorName) {
        updates.supervisorName = supervisorName;
        updates.supervisorId = supervisorId || '';
        updates.supervisorNames = [supervisorName];
        updates.supervisorIds = supervisorId ? [supervisorId] : [];
        historyEntries.unshift({
          id: `hist-${Date.now()}-${Math.random()}`,
          timestamp: now,
          userName: currentUser.name,
          action: `Designação em massa: Supervisor definido para ${supervisorName}`,
        });
      }

      if (status) {
        updates.status = status;
        updates.officialStatus = mapKanbanToOfficialStatus(status);
        historyEntries.unshift({
          id: `hist-${Date.now()}-${Math.random()}`,
          timestamp: now,
          userName: currentUser.name,
          action: `Designação em massa: Status alterado para ${status}`,
        });
      }

      if (dueDate) {
        updates.dueDate = dueDate;
      }

      updates.history = historyEntries;
      await updateDoc(doc(db, 'services', sId), updates);
    }
  };

  const batchCreateServicesFromTemplates = async (
    templateIds: string[],
    targetData: {
      location?: string;
      executorName?: string;
      supervisorName?: string;
      dueDate?: string;
      forecastMonth?: string;
    }
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const forecastMonth = targetData.forecastMonth || today.substring(0, 7);

    for (const tId of templateIds) {
      const template = problemTemplates.find((t) => t.id === tId);
      if (!template) continue;

      const safeExecutor =
        targetData.executorName && !isDummyPerson(targetData.executorName)
          ? targetData.executorName
          : currentUser?.name || 'Pedro Belchior';
      const safeSupervisor =
        targetData.supervisorName && !isDummyPerson(targetData.supervisorName) ? targetData.supervisorName : '';
      const matchedSupervisor = members.find((m) => m.name === safeSupervisor);

      await addService({
        title: template.problem,
        category: template.category,
        problem: template.problem,
        recommendedSolution: template.recommendedSolution,
        description: `Cadastrado a partir do modelo pré-fixado oficial (${template.category}).`,
        location: targetData.location || (locations[0]?.name ?? 'Auditório Principal'),
        risk: template.risk,
        highRiskWork: template.highRiskOption || (template.isHighRisk ? 'Sim' : 'Não'),
        isHighRisk: template.isHighRisk || template.highRiskOption === 'Sim',
        responsibleName: safeExecutor,
        executorName: safeExecutor,
        supervisorName: safeSupervisor,
        supervisorId: matchedSupervisor?.id || '',
        supervisorNames: safeSupervisor ? [safeSupervisor] : [],
        supervisorIds: matchedSupervisor ? [matchedSupervisor.id] : [],
        forecastMonth,
        dueDate: targetData.dueDate || today,
        status: 'NOVOS PROBLEMAS',
      });
    }
  };

  const moveService = (
    id: string,
    newStatus: ServiceStatus,
    skipCheck: boolean = false
  ): { success: boolean; requiresSafetyCheck?: boolean } => {
    const target = services.find((s) => s.id === id);
    if (!target) return { success: false };

    if (
      (target.highRiskWork === 'Sim' || target.isHighRisk) &&
      newStatus === 'EM ANDAMENTO' &&
      !target.safetyChecklistConfirmed &&
      !skipCheck
    ) {
      openSafetyModal(target);
      return { success: false, requiresSafetyCheck: true };
    }

    if (newStatus === 'CONCLUÍDO' && target.status !== 'CONCLUÍDO') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti fallback
      }
    }

    // Call updateService immediately (which does optimistic update and clean Firestore write)
    updateService(id, { status: newStatus }).catch((err) => {
      console.error('Error updating service status in Firestore:', err);
    });

    return { success: true };
  };

  const deleteService = async (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    if (selectedService?.id === id) {
      setSelectedService(null);
    }
    try {
      await deleteDoc(doc(db, 'services', id));
    } catch (err) {
      console.error('Error deleting service from Firestore:', err);
    }
  };

  const addHistoryEvent = async (
    serviceId: string,
    action: string,
    details?: string,
    field?: string,
    oldValue?: string,
    newValue?: string
  ) => {
    const target = services.find((s) => s.id === serviceId);
    if (!target) return;

    const newEvent: HistoryEvent = {
      id: `hist-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      userName: currentUser.name,
      action,
      details,
      field,
      oldValue,
      newValue,
    };

    const newHistory = [newEvent, ...(target.history || [])];
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, history: newHistory, updatedAt: new Date().toISOString() } : s))
    );

    await updateDoc(doc(db, 'services', serviceId), cleanFirestoreData({
      history: newHistory,
      updatedAt: new Date().toISOString(),
    }));
  };

  // Categories Actions
  const addCategory = async (cat: Omit<CategoryItem, 'id'>) => {
    const newId = `cat-${Date.now()}`;
    const newCat: CategoryItem = {
      ...cat,
      id: newId,
    };
    setCategories((prev) => [...prev, newCat]);
    await setDoc(doc(db, 'categories', newId), cleanFirestoreData(newCat));
  };

  const updateCategory = async (id: string, updates: Partial<CategoryItem>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    await updateDoc(doc(db, 'categories', id), cleanFirestoreData(updates));
  };

  const toggleCategoryStatus = async (id: string) => {
    const target = categories.find((c) => c.id === id);
    if (target) {
      const updatedActive = !target.active;
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, active: updatedActive } : c)));
      await updateDoc(doc(db, 'categories', id), { active: updatedActive });
    }
  };

  const deleteCategory = async (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    await deleteDoc(doc(db, 'categories', id));
  };

  // Problem Templates Actions
  const addProblemTemplate = async (tpl: Omit<ProblemTemplate, 'id'>) => {
    const newId = `prob-${Date.now()}`;
    const newTpl: ProblemTemplate = {
      ...tpl,
      id: newId,
    };
    setProblemTemplates((prev) => [...prev, newTpl]);
    await setDoc(doc(db, 'problemTemplates', newId), cleanFirestoreData(newTpl));
  };

  const updateProblemTemplate = async (id: string, updates: Partial<ProblemTemplate>) => {
    setProblemTemplates((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    await updateDoc(doc(db, 'problemTemplates', id), cleanFirestoreData(updates));
  };

  const deleteProblemTemplate = async (id: string) => {
    setProblemTemplates((prev) => prev.filter((p) => p.id !== id));
    await deleteDoc(doc(db, 'problemTemplates', id));
  };

  // Locations Actions
  const addLocation = async (loc: Omit<LocationItem, 'id'>) => {
    const newId = `loc-${Date.now()}`;
    const newLoc: LocationItem = {
      ...loc,
      id: newId,
    };
    setLocations((prev) => [...prev, newLoc]);
    await setDoc(doc(db, 'locations', newId), cleanFirestoreData(newLoc));
  };

  const updateLocation = async (id: string, updates: Partial<LocationItem>) => {
    setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
    await updateDoc(doc(db, 'locations', id), cleanFirestoreData(updates));
  };

  const deleteLocation = async (id: string) => {
    setLocations((prev) => prev.filter((l) => l.id !== id));
    await deleteDoc(doc(db, 'locations', id));
  };

  // Members Actions
  const addMember = async (mbr: Omit<UserMember, 'id'>) => {
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);
    const newId = `user-${Date.now()}-${uniqueSuffix}`;
    const newMbr: UserMember = {
      ...mbr,
      id: newId,
    };
    setMembers((prev) => [...prev, newMbr]);
    await setDoc(doc(db, 'members', newId), cleanFirestoreData(newMbr));
  };

  const addMembersBatch = async (membersList: Omit<UserMember, 'id'>[]): Promise<number> => {
    if (!membersList || membersList.length === 0) return 0;
    const now = Date.now();
    const newMembersToInsert: UserMember[] = membersList.map((mbr, index) => {
      const uniqueSuffix = Math.random().toString(36).substring(2, 8);
      const newId = `user-${now + index}-${uniqueSuffix}`;
      return {
        ...mbr,
        id: newId,
      };
    });

    // Optimistic UI state update
    setMembers((prev) => [...prev, ...newMembersToInsert]);

    // Save to Firestore in chunks of parallel writes to prevent throttling
    const CHUNK_SIZE = 25;
    for (let i = 0; i < newMembersToInsert.length; i += CHUNK_SIZE) {
      const chunk = newMembersToInsert.slice(i, i + CHUNK_SIZE);
      await Promise.all(
        chunk.map((item) => setDoc(doc(db, 'members', item.id), cleanFirestoreData(item)))
      );
    }

    return newMembersToInsert.length;
  };

  const updateMember = async (id: string, updates: Partial<UserMember>) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    if (
      currentUser.id === id ||
      (currentUser.email && updates.email && currentUser.email.toLowerCase().trim() === updates.email.toLowerCase().trim())
    ) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('sr_current_user_v5', JSON.stringify(updatedUser));
        localStorage.setItem('active_user_id', id);
      } catch {
        // Ignore
      }
    }
    await updateDoc(doc(db, 'members', id), cleanFirestoreData(updates));
  };

  const deleteMember = async (id: string) => {
    setMembers((prev) => {
      const remaining = prev.filter((m) => m.id !== id);
      if (currentUser.id === id) {
        if (remaining.length > 0) {
          setCurrentUser(remaining[0]);
        } else {
          setCurrentUser(DEFAULT_ADMIN_USER);
        }
      }
      return remaining;
    });
    try {
      await deleteDoc(doc(db, 'members', id));
    } catch (err) {
      console.error('Error deleting member from Firestore:', err);
    }
  };

  // Budgets Actions
  const setMonthlyBudget = async (month: string, ceilingAmount: number, notes?: string) => {
    const monthIndex = parseInt(month.split('-')[1] || '1', 10) - 1;
    const monthName = monthIndex >= 0 && monthIndex < 12 ? MONTH_NAMES[monthIndex] : undefined;
    const budgetDoc: MonthlyBudget = {
      month,
      ceilingAmount,
      notes: notes || '',
      monthName,
    };
    setMonthlyBudgets((prev) => [budgetDoc, ...prev.filter((b) => b.month !== month)]);
    await setDoc(doc(db, 'monthlyBudgets', month), cleanFirestoreData(budgetDoc));
  };

  // Clear Database (Zero sample data)
  const clearDatabase = async () => {
    for (const s of services) {
      await deleteDoc(doc(db, 'services', s.id));
    }
    for (const c of categories) {
      await deleteDoc(doc(db, 'categories', c.id));
    }
    for (const p of problemTemplates) {
      await deleteDoc(doc(db, 'problemTemplates', p.id));
    }
    for (const l of locations) {
      await deleteDoc(doc(db, 'locations', l.id));
    }
    for (const m of members) {
      await deleteDoc(doc(db, 'members', m.id));
    }
    for (const b of monthlyBudgets) {
      await deleteDoc(doc(db, 'monthlyBudgets', b.month));
    }
    localStorage.clear();
  };

  const exportDatabaseJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      system: 'Sistema de Manutenção do Salão do Reino (Firebase Cloud)',
      services,
      categories,
      problemTemplates,
      locations,
      members,
      monthlyBudgets,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_firestore_manutencao_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDatabaseJSON = async (jsonData: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(jsonData);
      const servicesList = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.services)
        ? parsed.services
        : Array.isArray(parsed.problems)
        ? parsed.problems
        : [];

      if (servicesList.length > 0) {
        for (const s of servicesList) {
          const serviceId = s.id || `serv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const normStatus = normalizeServiceStatus(s.status);
          const safeItem: ServiceItem = {
            ...s,
            id: serviceId,
            status: normStatus,
            officialStatus: mapKanbanToOfficialStatus(normStatus),
          };
          await setDoc(doc(db, 'services', serviceId), cleanFirestoreData(safeItem));
        }
      }

      if (parsed.categories && Array.isArray(parsed.categories)) {
        for (const c of parsed.categories) {
          await setDoc(doc(db, 'categories', c.id), c);
        }
      }
      if (parsed.problemTemplates && Array.isArray(parsed.problemTemplates)) {
        for (const p of parsed.problemTemplates) {
          await setDoc(doc(db, 'problemTemplates', p.id), p);
        }
      }
      if (parsed.locations && Array.isArray(parsed.locations)) {
        for (const l of parsed.locations) {
          await setDoc(doc(db, 'locations', l.id), l);
        }
      }
      if (parsed.members && Array.isArray(parsed.members)) {
        for (const m of parsed.members) {
          await setDoc(doc(db, 'members', m.id), m);
        }
      }
      if (parsed.monthlyBudgets && Array.isArray(parsed.monthlyBudgets)) {
        for (const b of parsed.monthlyBudgets) {
          await setDoc(doc(db, 'monthlyBudgets', b.month), b);
        }
      }
      return true;
    } catch (e) {
      console.error('Error importing backup JSON to Firestore', e);
      return false;
    }
  };

  const importSpreadsheetFile = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json<any>(worksheet);

          if (!json || json.length === 0) {
            resolve(false);
            return;
          }

          for (let idx = 0; idx < json.length; idx++) {
            const row = json[idx];
            const rawRisk = Number(row['Risco'] || row['risco'] || 3);
            const risk: RiskLevel = ([1, 2, 3, 4, 5].includes(rawRisk) ? rawRisk : 3) as RiskLevel;
            const classif = getSpreadsheetClassification(risk);

            const highRiskRaw = String(row['Alto Risco'] || row['alto_risco'] || '').toLowerCase();
            const highRiskWork: YesNoEmpty = highRiskRaw.includes('sim') || highRiskRaw === 's' ? 'Sim' : 'Não';
            const cost = Number(row['Custo Estimado'] || row['Custo'] || row['custo_estimado'] || 0);

            const forecastMonth = row['Previsão Mês'] || row['Mês'] || new Date().toISOString().substring(0, 7);
            const statusRaw = String(row['Status'] || row['Etapa'] || 'NOVOS PROBLEMAS').toUpperCase();

            let stage: ServiceStatus = 'NOVOS PROBLEMAS';
            if (statusRaw.includes('ANDAMENTO')) stage = 'EM ANDAMENTO';
            else if (statusRaw.includes('AVALIAR')) stage = 'A AVALIAR';
            else if (statusRaw.includes('PLANEJADO')) stage = 'PLANEJADO';
            else if (statusRaw.includes('MATERIAL')) stage = 'AGUARDANDO MATERIAL';
            else if (statusRaw.includes('TERCEIRO')) stage = 'AGUARDANDO TERCEIRO';
            else if (statusRaw.includes('CONCLU')) stage = 'CONCLUÍDO';
            else if (statusRaw.includes('CANCEL')) stage = 'CANCELADO';

            const tmCalc = calculateTMConsultation(highRiskWork, cost, 2500);
            const serviceId = `imported-${Date.now()}-${idx}`;

            const item: ServiceItem = {
              id: serviceId,
              code: `SR-IMP-${String(idx + 1).padStart(3, '0')}`,
              title: row['Problema'] || row['Título'] || row['Titulo'] || `Serviço ${idx + 1}`,
              category: row['Categoria'] || 'Elétrica',
              problem: row['Problema'] || '',
              description: row['Descrição'] || row['Observações'] || '',
              location: row['Local'] || 'Auditório Principal',
              recommendedSolution: row['Solução'] || row['Solução Recomendada'] || '',
              gravity: classif.gravityLevel,
              gravityText: classif.gravityText,
              urgency: classif.urgencyLevel,
              urgencyText: classif.urgencyText,
              trend: classif.trendLevel,
              trendText: classif.trendText,
              priorityScore: classif.score,
              priority: classif.priority,
              risk,
              responsibleId: currentUser.id,
              responsibleName: row['Responsável'] || row['Responsavel'] || currentUser.name,
              executorName: row['Executor'] || row['Responsável'] || currentUser.name,
              supervisorName: row['Supervisor'] || '',
              identifiedDate: new Date().toISOString().split('T')[0],
              forecastMonth,
              dueDate: new Date().toISOString().split('T')[0],
              status: stage,
              officialStatus: mapKanbanToOfficialStatus(stage),
              estimatedCost: cost,
              approvedCost: cost,
              actualCost: 0,
              highRiskWork,
              isHighRisk: highRiskWork === 'Sim',
              needsTMOption: tmCalc.needsTMOption,
              needsTM: tmCalc.needsTM,
              notes: row['Observações'] || '',
              attachments: [],
              history: [
                {
                  id: `hist-imp-${Date.now()}-${idx}`,
                  timestamp: new Date().toISOString(),
                  userName: 'Importação Excel',
                  action: 'Importou serviço via planilha',
                },
              ],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            await setDoc(doc(db, 'services', serviceId), item);
          }

          resolve(true);
        } catch (err) {
          console.error('Error importing Excel file to Firestore', err);
          resolve(false);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  return (
    <MaintenanceContext.Provider
      value={{
        services,
        categories,
        problemTemplates,
        locations,
        members,
        monthlyBudgets,
        currentUser,
        firebaseUser,
        isAuthenticated: !!firebaseUser,
        canEditServices,
        isAdmin,
        toggleMemberEditPermission,
        activeTab,
        filterState,
        selectedService,
        isNewServiceModalOpen,
        preselectedCategoryForNew,
        safetyModalService,
        isLoading,
        firebaseConnected,

        isAuthModalOpen,
        setIsAuthModalOpen,
        isUserManagementModalOpen,
        editingMemberForModal,
        openUserManagementModal,
        closeUserManagementModal,
        isProblemTemplatesModalOpen,
        openProblemTemplatesModal,
        closeProblemTemplatesModal,
        isBatchAssignModalOpen,
        batchAssignTargetIds,
        openBatchAssignModal,
        closeBatchAssignModal,

        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,

        setActiveTab,
        setCurrentUser,
        switchUser,
        setFilterState,
        resetFilters,
        openNewServiceModal,
        closeNewServiceModal,
        selectService,
        closeServiceDetail,
        openSafetyModal,
        closeSafetyModal,
        confirmSafetyAndStart,

        addService,
        updateService,
        moveService,
        deleteService,
        addHistoryEvent,
        batchAssignServices,
        batchCreateServicesFromTemplates,

        addCategory,
        updateCategory,
        toggleCategoryStatus,
        deleteCategory,

        addProblemTemplate,
        updateProblemTemplate,
        deleteProblemTemplate,
        seedPreFixedData,

        addLocation,
        updateLocation,
        deleteLocation,

        addMember,
        addMembersBatch,
        updateMember,
        deleteMember,

        setMonthlyBudget,
        getBudgetForMonth,

        clearDatabase,
        exportDatabaseJSON,
        importDatabaseJSON,
        importSpreadsheetFile,
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenance = () => {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error('useMaintenance must be used within a MaintenanceProvider');
  }
  return context;
};
