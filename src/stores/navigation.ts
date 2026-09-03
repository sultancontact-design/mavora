import { create } from 'zustand';
import { useRouter } from 'next/navigation';

export type ViewType = 'home' | 'browse' | 'detail' | 'setup' | 'create-listing' | 'profile' | 'favorites' | 'messages' | 'admin' | 'seller' | 'organization' | 'wallet' | 'invoices';

interface NavigationState {
  view: ViewType;
  selectedCategoryId: string | null;
  selectedListingId: string | null;
  selectedSellerId: string | null;
  editingListingId: string | null;
  searchQuery: string | null;
  dbConfigured: boolean | null;

  setView: (view: ViewType) => void;
  selectCategory: (categoryId: string | null) => void;
  selectListing: (listingId: string | null) => void;
  setSearchQuery: (query: string | null) => void;
  setDbConfigured: (configured: boolean) => void;
  
  // Navigation methods - now using Next.js router
  navigateHome: () => void;
  navigateBrowse: (categoryId?: string | null, search?: string | null) => void;
  navigateDetail: (listingId: string) => void;
  navigateCreateListing: () => void;
  navigateEditListing: (id: string) => void;
  clearEditingListing: () => void;
  navigateProfile: (userId?: string) => void;
  navigateFavorites: () => void;
  navigateMessages: () => void;
  navigateAdmin: () => void;
  navigateSeller: (userId: string) => void;
  navigateOrganization: (orgId?: string) => void;
  navigateWallet: () => void;
  navigateInvoices: () => void;
}

// We'll use a singleton router reference that gets initialized on client side
let routerInstance: ReturnType<typeof useRouter> | null = null;

export const setRouterInstance = (router: ReturnType<typeof useRouter>) => {
  routerInstance = router;
};

export const useNavigationStore = create<NavigationState>((set, get) => ({
  view: 'home',
  selectedCategoryId: null,
  selectedListingId: null,
  selectedSellerId: null,
  editingListingId: null,
  searchQuery: null,
  dbConfigured: null,

  setView: (view) => {
    set({ view });
    // Also update URL based on view
    const urlMap: Record<ViewType, string> = {
      'home': '/',
      'browse': '/listings',
      'detail': `/listings/${get().selectedListingId || ''}`,
      'setup': '/setup',
      'create-listing': '/listings/create',
      'profile': '/profile',
      'favorites': '/favorites',
      'messages': '/messages',
      'admin': '/admin',
      'seller': `/seller/${get().selectedSellerId || ''}`,
      'organization': `/organization/${get().selectedCategoryId || ''}`,
      'wallet': '/wallet',
      'invoices': '/invoices',
    };
    
    if (routerInstance) {
      routerInstance.push(urlMap[view]);
    }
  },
  
  selectCategory: (categoryId) => set({ selectedCategoryId: categoryId }),
  selectListing: (listingId) => set({ selectedListingId: listingId }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setDbConfigured: (configured) => set({ dbConfigured: configured }),

  // Updated navigation methods that use Next.js router
  navigateHome: () => {
    set({
      view: 'home',
      selectedCategoryId: null,
      selectedListingId: null,
      selectedSellerId: null,
      editingListingId: null,
      searchQuery: null,
    });
    if (routerInstance) routerInstance.push('/');
  },

  navigateBrowse: (categoryId = null, search = null) => {
    set({
      view: 'browse',
      selectedCategoryId: categoryId,
      selectedListingId: null,
      selectedSellerId: null,
      editingListingId: null,
      searchQuery: search,
    });
    let url = '/listings';
    const params = new URLSearchParams();
    if (categoryId) params.set('category', categoryId);
    if (search) params.set('q', search);
    if (params.toString()) url += `?${params.toString()}`;
    if (routerInstance) routerInstance.push(url);
  },

  navigateDetail: (listingId) => {
    set({
      view: 'detail',
      selectedListingId: listingId,
      selectedSellerId: null,
      editingListingId: null,
    });
    if (routerInstance) routerInstance.push(`/listings/${listingId}`);
  },

  navigateCreateListing: () => {
    set({
      view: 'create-listing',
      selectedListingId: null,
      selectedSellerId: null,
      editingListingId: null,
    });
    if (routerInstance) routerInstance.push('/listings/create');
  },

  navigateEditListing: (id) => {
    set({
      view: 'create-listing',
      editingListingId: id,
      selectedListingId: null,
      selectedSellerId: null,
    });
    if (routerInstance) routerInstance.push(`/listings/create?edit=${id}`);
  },

  clearEditingListing: () =>
    set({ editingListingId: null }),

  navigateProfile: (userId) => {
    set({
      view: 'profile',
      selectedListingId: null,
      selectedSellerId: null,
      editingListingId: null,
      selectedCategoryId: userId ?? null,
    });
    if (routerInstance) routerInstance.push('/profile');
  },

  navigateFavorites: () => {
    set({
      view: 'favorites',
      selectedListingId: null,
      selectedCategoryId: null,
      selectedSellerId: null,
      editingListingId: null,
      searchQuery: null,
    });
    if (routerInstance) routerInstance.push('/favorites');
  },

  navigateMessages: () => {
    set({
      view: 'messages',
      selectedListingId: null,
      selectedCategoryId: null,
      selectedSellerId: null,
      editingListingId: null,
      searchQuery: null,
    });
    if (routerInstance) routerInstance.push('/messages');
  },

  navigateAdmin: () => {
    set({
      view: 'admin',
      selectedListingId: null,
      selectedCategoryId: null,
      selectedSellerId: null,
      editingListingId: null,
      searchQuery: null,
    });
    if (routerInstance) routerInstance.push('/admin');
  },

  navigateSeller: (userId) => {
    set({
      view: 'seller',
      selectedSellerId: userId,
      selectedListingId: null,
      selectedCategoryId: null,
      editingListingId: null,
      searchQuery: null,
    });
    if (routerInstance) routerInstance.push(`/seller/${userId}`);
  },

  navigateOrganization: (orgId) => {
    set({
      view: 'organization',
      selectedCategoryId: orgId ?? null,
      selectedSellerId: null,
      selectedListingId: null,
      editingListingId: null,
      searchQuery: null,
    });
    if (routerInstance) routerInstance.push(`/organization/${orgId || ''}`);
  },

  navigateWallet: () => {
    set({
      view: 'wallet',
      selectedCategoryId: null,
      selectedSellerId: null,
      selectedListingId: null,
      editingListingId: null,
      searchQuery: null,
    });
    if (routerInstance) routerInstance.push('/wallet');
  },

  navigateInvoices: () => {
    set({
      view: 'invoices',
      selectedCategoryId: null,
      selectedSellerId: null,
      selectedListingId: null,
      editingListingId: null,
      searchQuery: null,
    });
    if (routerInstance) routerInstance.push('/invoices');
  },
}));
