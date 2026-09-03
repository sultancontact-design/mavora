import { create } from 'zustand';

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

export const useNavigationStore = create<NavigationState>((set) => ({
  view: 'home',
  selectedCategoryId: null,
  selectedListingId: null,
  selectedSellerId: null,
  editingListingId: null,
  searchQuery: null,
  dbConfigured: null,

  setView: (view) => set({ view }),
  selectCategory: (categoryId) => set({ selectedCategoryId: categoryId }),
  selectListing: (listingId) => set({ selectedListingId: listingId }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setDbConfigured: (configured) => set({ dbConfigured: configured }),

  navigateHome: () =>
    set({
      view: 'home',
      selectedCategoryId: null,
      selectedListingId: null,
      selectedSellerId: null,
      editingListingId: null,
      searchQuery: null,
    }),

  navigateBrowse: (categoryId = null, search = null) =>
    set({
      view: 'browse',
      selectedCategoryId: categoryId,
      selectedListingId: null,
      selectedSellerId: null,
      editingListingId: null,
      searchQuery: search,
    }),

  navigateDetail: (listingId) =>
    set({
      view: 'detail',
      selectedListingId: listingId,
      selectedSellerId: null,
      editingListingId: null,
    }),

  navigateCreateListing: () =>
    set({
      view: 'create-listing',
      selectedListingId: null,
      selectedSellerId: null,
      editingListingId: null,
    }),

  navigateEditListing: (id) =>
    set({
      view: 'create-listing',
      editingListingId: id,
      selectedListingId: null,
      selectedSellerId: null,
    }),

  clearEditingListing: () =>
    set({ editingListingId: null }),

  navigateProfile: (userId) =>
    set({
      view: 'profile',
      selectedListingId: null,
      selectedSellerId: null,
      editingListingId: null,
      // Store userId in selectedCategoryId temporarily for profile viewing
      selectedCategoryId: userId ?? null,
    }),

  navigateFavorites: () =>
    set({
      view: 'favorites',
      selectedListingId: null,
      selectedCategoryId: null,
      selectedSellerId: null,
      editingListingId: null,
      searchQuery: null,
    }),

  navigateMessages: () =>
    set({
      view: 'messages',
      selectedListingId: null,
      selectedCategoryId: null,
      selectedSellerId: null,
      editingListingId: null,
      searchQuery: null,
    }),

  navigateAdmin: () =>
    set({
      view: 'admin',
      selectedListingId: null,
      selectedCategoryId: null,
      selectedSellerId: null,
      editingListingId: null,
      searchQuery: null,
    }),

  navigateSeller: (userId) =>
    set({
      view: 'seller',
      selectedSellerId: userId,
      selectedListingId: null,
      selectedCategoryId: null,
      editingListingId: null,
      searchQuery: null,
    }),

  navigateOrganization: (orgId) =>
    set({
      view: 'organization',
      selectedCategoryId: orgId ?? null,
      selectedSellerId: null,
      selectedListingId: null,
      editingListingId: null,
      searchQuery: null,
    }),

  navigateWallet: () =>
    set({
      view: 'wallet',
      selectedCategoryId: null,
      selectedSellerId: null,
      selectedListingId: null,
      editingListingId: null,
      searchQuery: null,
    }),

  navigateInvoices: () =>
    set({
      view: 'invoices',
      selectedCategoryId: null,
      selectedSellerId: null,
      selectedListingId: null,
      editingListingId: null,
      searchQuery: null,
    }),
}));
