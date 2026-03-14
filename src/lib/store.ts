import { create } from 'zustand';

export interface User {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  adresse: string;
  numeroCNI: string;
  dateNaissance: string;
  role: string;
  statut: string;
}

export interface Notification {
  id: string;
  type: string;
  titre: string;
  message: string;
  lu: boolean;
  lien: string | null;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, isAuthenticated: false, isLoading: false }),
}));

interface NotificationState {
  notifications: Notification[];
  nonLues: number;
  setNotifications: (notifications: Notification[]) => void;
  setNonLues: (count: number) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  nonLues: 0,
  setNotifications: (notifications) => set({ notifications }),
  setNonLues: (nonLues) => set({ nonLues }),
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    nonLues: state.nonLues + (notification.lu ? 0 : 1),
  })),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n =>
      n.id === id ? { ...n, lu: true } : n
    ),
    nonLues: Math.max(0, state.nonLues - 1),
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, lu: true })),
    nonLues: 0,
  })),
}));

interface MembreForm {
  prenom: string;
  nom: string;
  dateNaissance: string;
  numeroCNI: string;
  telephone: string;
  adresse: string;
}

interface DemandeState {
  typePret: 'SILVER' | 'GOLD' | null;
  montant: number;
  membres: MembreForm[];
  currentStep: number;
  avancePaid: boolean;
  setTypePret: (type: 'SILVER' | 'GOLD') => void;
  setMontant: (montant: number) => void;
  addMembre: (membre: MembreForm) => void;
  updateMembre: (index: number, membre: MembreForm) => void;
  removeMembre: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  setAvancePaid: (paid: boolean) => void;
}

const initialMembre: MembreForm = {
  prenom: '',
  nom: '',
  dateNaissance: '',
  numeroCNI: '',
  telephone: '',
  adresse: '',
};

export const useDemandeStore = create<DemandeState>((set) => ({
  typePret: null,
  montant: 0,
  membres: Array(10).fill(null).map(() => ({ ...initialMembre })),
  currentStep: 1,
  avancePaid: false,
  setTypePret: (typePret) => set({ typePret }),
  setMontant: (montant) => set({ montant }),
  addMembre: (membre) => set((state) => ({
    membres: [...state.membres, membre]
  })),
  updateMembre: (index, membre) => set((state) => {
    const newMembres = [...state.membres];
    newMembres[index] = membre;
    return { membres: newMembres };
  }),
  removeMembre: (index) => set((state) => ({
    membres: state.membres.filter((_, i) => i !== index)
  })),
  nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  prevStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),
  reset: () => set({
    typePret: null,
    montant: 0,
    membres: Array(10).fill(null).map(() => ({ ...initialMembre })),
    currentStep: 1,
    avancePaid: false,
  }),
  setAvancePaid: (avancePaid) => set({ avancePaid }),
}));
