import { EquipmentItem } from '../types';

// IDs dos equipamentos de exemplo gerados inicialmente
export const MOCK_EQUIPMENT_IDS = [
  'eq-ac-01',
  'eq-ac-02',
  'eq-ac-03',
  'eq-av-01',
  'eq-av-02',
  'eq-beb-01',
  'eq-hid-01',
  'eq-ext-01',
  'eq-ger-01',
];

// O inventário inicial inicia 100% limpo para o usuário cadastrar os equipamentos reais do Salão
export const INITIAL_EQUIPMENTS: EquipmentItem[] = [];
