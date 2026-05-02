import {
  useGetUserProfile as useGetUserProfileGenerated,
  getGetUserProfileQueryKey,
  type UserProfile,
} from "@workspace/api-client-react";

export type ProfileStatus = "loading" | "ok" | "forbidden" | "notFound" | "error";

export interface UseUserProfileResult {
  status: ProfileStatus;
  profile: UserProfile | undefined;
  error: unknown;
  refetch: () => void;
}

export function useUserProfile(userId: number | null | undefined): UseUserProfileResult {
  const enabled = typeof userId === "number" && Number.isFinite(userId) && userId > 0;

  const resolvedUserId = (enabled ? userId : 0) as number;

  const query = useGetUserProfileGenerated(
    resolvedUserId,
    { query: { queryKey: getGetUserProfileQueryKey(resolvedUserId), enabled } },
  );

  let status: ProfileStatus = "loading";
  if (!enabled) {
    status = "notFound";
  } else if (query.isLoading) {
    status = "loading";
  } else if (query.isError) {
    const httpStatus = (query.error as { status?: number } | undefined)?.status;
    if (httpStatus === 403) status = "forbidden";
    else if (httpStatus === 404) status = "notFound";
    else status = "error";
  } else if (query.data) {
    status = "ok";
  }

  return {
    status,
    profile: query.data,
    error: query.error,
    refetch: query.refetch,
  };
}
