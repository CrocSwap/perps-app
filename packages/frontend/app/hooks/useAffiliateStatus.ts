import { useAffiliateAudience } from '~/routes/affiliates/hooks/useAffiliateData';
import { useUserDataStore } from '~/stores/UserDataStore';

export function useAffiliateStatus() {
    const { userAddress } = useUserDataStore();
    const { data, isLoading } = useAffiliateAudience(userAddress || '', true);

    const isAffiliateAccepted = data?.isAffiliateAccepted ?? false;

    return {
        isAffiliateAccepted,
        isLoading,
        hasUserAddress: !!userAddress,
    };
}
