import { inject, provide, ref, type InjectionKey, type Ref } from 'vue';

interface LoginDialogContext {
  showLoginDialog: Ref<boolean>;
  showRegisterDialog: Ref<boolean>;
  openLoginDialog: () => void;
  openRegisterDialog: () => void;
}

const LoginDialogKey: InjectionKey<LoginDialogContext> = Symbol('LoginDialog');

export function provideLoginDialog() {
  const showLoginDialog = ref(false);
  const showRegisterDialog = ref(false);

  const openLoginDialog = () => {
    showLoginDialog.value = true;
    showRegisterDialog.value = false;
  };

  const openRegisterDialog = () => {
    showRegisterDialog.value = true;
    showLoginDialog.value = false;
  };

  const context: LoginDialogContext = {
    showLoginDialog,
    showRegisterDialog,
    openLoginDialog,
    openRegisterDialog,
  };

  provide(LoginDialogKey, context);

  return context;
}

export function useLoginDialog() {
  const context = inject(LoginDialogKey);
  if (!context) {
    throw new Error('useLoginDialog must be used within a provider');
  }
  return context;
}
