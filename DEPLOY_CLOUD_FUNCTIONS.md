# 🔔 Como Ativar Notificações com o App Fechado (Firebase Cloud Functions)

Este guia explica como implantar a **Firebase Cloud Function** configurada neste projeto para que todos os celulares Android e navegadores registrados recebam notificações sonoras e na barra de status **mesmo com o aplicativo totalmente fechado e com a tela apagada**.

---

## 🏗️ Como Funciona

1. **Geração do Token FCM no Celular:**
   - O usuário abre o app no celular Android.
   - Clica no sino 🔔 no topo e clica em **"Gerar Token FCM no Android"**.
   - O identificador do aparelho é gravado na coleção `fcmTokens` do Firestore.

2. **Detecção Automática na Nuvem:**
   - Sempre que alguém cadastra um novo problema/serviço (`services/{serviceId}`), os servidores do Google disparam a função `onServiceCreated` em `functions/index.js`.
   - A função busca todos os aparelhos registrados em `fcmTokens` e envia uma notificação push de **alta prioridade** (`priority: high`) diretamente para a antena do celular via Google Play Services.

---

## 🚀 Passo a Passo para Implantar a Função (1 Comando)

### Pré-requisitos:
- Ter o **Node.js** instalado (versão 18 ou 20).
- Ter o plano **Blaze (Pay-as-you-go)** ativado no Firebase Console para o projeto `gen-lang-client-0282193407` (o plano Blaze é gratuito para Cloud Functions até 2 milhões de invocações por mês, e o FCM é 100% gratuito).

### No seu computador / terminal:

1. Abra a pasta do projeto no terminal.
2. Instale as dependências da pasta de funções:
   ```bash
   cd functions
   npm install
   cd ..
   ```
3. Faça login no Firebase (caso ainda não tenha feito):
   ```bash
   firebase login
   ```
4. Implante as funções no Google Cloud:
   ```bash
   firebase deploy --only functions
   ```

Pronto! A partir desse momento, qualquer novo serviço cadastrado no Salão do Reino tocará o celular de todos os irmãos registrados, mesmo que o aplicativo não esteja aberto.
