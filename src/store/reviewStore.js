import { create } from "zustand";
import { reviewsAPI } from "../services/api";
import useAuthStore from "./authStore";

const normalizeReview = (review) => {
  if (!review) {
    return null;
  }

  // Extract data from response wrapper if exists
  const reviewData = review?.data || review;

  return {
    reviewId: reviewData.reviewId ?? reviewData.review_id ?? reviewData.id,
    userId: reviewData.userId ?? reviewData.user_id,
    userName: reviewData.userName ?? reviewData.user_name ?? reviewData.name,
    userAvatar: reviewData.userAvatar ?? reviewData.user_avatar,
    stationId: reviewData.stationId ?? reviewData.station_id,
    stationName: reviewData.stationName ?? reviewData.station_name,
    rating: reviewData.rating,
    comment: reviewData.comment,
    createdAt: reviewData.createdAt ?? reviewData.created_at,
    updatedAt: reviewData.updatedAt ?? reviewData.updated_at,
  };
};

const resolveUserId = (user) =>
  user?.userId ?? user?.user_id ?? user?.id ?? user?.UserId ?? null;

const isSameUser = (review, userId) => {
  if (!review || !userId) {
    return false;
  }

  const reviewUserId =
    review.userId ?? review.user_id ?? review.UserId ?? review.user_id;

  return reviewUserId === userId;
};

const useReviewStore = create((set, get) => ({
  stationReviews: {},
  summaries: {},
  loading: false,
  submitting: false,
  error: null,

  fetchStationReviews: async (stationId, page = 1, pageSize = 10) => {
    if (!stationId) {
      return;
    }

    set({ loading: true, error: null });

    try {
      const response = await reviewsAPI.getStationReviews(stationId, {
        page,
        pageSize,
      });

      const reviewsPayload = Array.isArray(response?.data) ? response.data : [];
      const pagination = response?.pagination || {};

      const normalizedReviews = reviewsPayload
        .map(normalizeReview)
        .filter(Boolean);

      set((state) => ({
        stationReviews: {
          ...state.stationReviews,
          [stationId]: {
            data: normalizedReviews,
            pagination: {
              page: pagination.page ?? page,
              pageSize: pagination.pageSize ?? pageSize,
              totalCount: pagination.totalCount ?? normalizedReviews.length,
              totalPages: pagination.totalPages ?? 1,
            },
          },
        },
        loading: false,
      }));

      return normalizedReviews;
    } catch (error) {
      console.error("❌ Failed to fetch station reviews:", error);
      set({
        loading: false,
        error: error?.message || "Không thể tải đánh giá trạm",
      });
      throw error;
    }
  },

  fetchStationSummary: async (stationId) => {
    if (!stationId) {
      return null;
    }

    try {
      const summary = await reviewsAPI.getStationSummary(stationId);
      set((state) => ({
        summaries: {
          ...state.summaries,
          [stationId]: {
            stationId,
            averageRating: Number(
              summary?.averageRating ?? summary?.data?.averageRating ?? 0
            ),
            totalReviews: Number(
              summary?.totalReviews ?? summary?.data?.totalReviews ?? 0
            ),
            fiveStarCount: Number(
              summary?.fiveStarCount ?? summary?.data?.fiveStarCount ?? 0
            ),
            fourStarCount: Number(
              summary?.fourStarCount ?? summary?.data?.fourStarCount ?? 0
            ),
            threeStarCount: Number(
              summary?.threeStarCount ?? summary?.data?.threeStarCount ?? 0
            ),
            twoStarCount: Number(
              summary?.twoStarCount ?? summary?.data?.twoStarCount ?? 0
            ),
            oneStarCount: Number(
              summary?.oneStarCount ?? summary?.data?.oneStarCount ?? 0
            ),
          },
        },
      }));

      return get().summaries[stationId];
    } catch (error) {
      console.error("❌ Failed to fetch station summary:", error);
      set({
        error: error?.message || "Không thể tải điểm đánh giá",
      });
      throw error;
    }
  },

  submitReview: async ({ stationId, rating, comment }) => {
    // ✅ Check authentication before API call
    const token =
      sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) {
      console.error("❌ No auth token - user not logged in");
      throw new Error("Vui lòng đăng nhập để đánh giá");
    }

    if (!stationId) {
      throw new Error("Thiếu thông tin trạm sạc");
    }

    if (!rating) {
      throw new Error("Vui lòng chọn số sao đánh giá");
    }

    set({ submitting: true, error: null });

    try {
      const payload = {
        stationId,
        rating,
        comment,
      };

      console.log("📤 Submitting review:", payload);
      console.log("🔐 Auth token present:", token.substring(0, 20) + "...");

      const response = await reviewsAPI.create(payload);
      // Backend trả về response.data chứa review object
      const reviewData = response?.data || response;
      const normalized = normalizeReview(reviewData);

      set((state) => {
        const existing = state.stationReviews[stationId]?.data || [];
        return {
          stationReviews: {
            ...state.stationReviews,
            [stationId]: {
              data: normalized ? [normalized, ...existing] : existing,
              pagination: state.stationReviews[stationId]?.pagination || {
                page: 1,
                pageSize: existing.length + 1,
                totalCount: existing.length + (normalized ? 1 : 0),
                totalPages: 1,
              },
            },
          },
          submitting: false,
        };
      });

      await get().fetchStationSummary(stationId);
      return { review: normalized, wasUpdated: false };
    } catch (error) {
      console.error("❌ Failed to submit review:", error);

      const apiMessage = error?.response?.data?.message || error?.message || "";
      const lowerMessage = apiMessage.toLowerCase();

      // Đơn giản hóa - chỉ show error message, không cố update
      const fallbackMessage =
        apiMessage || "Không thể gửi đánh giá, vui lòng thử lại sau";

      set({
        submitting: false,
        error: lowerMessage.includes("already reviewed")
          ? "Bạn đã đánh giá trạm này rồi. Vui lòng tải lại trang để xem đánh giá của bạn."
          : fallbackMessage,
      });

      throw error;
    }
  },

  // Helper: Check if current user has reviewed this station
  hasUserReviewed: (stationId) => {
    const state = get();
    const user = useAuthStore.getState().user;
    const userId = resolveUserId(user);

    if (!userId || !stationId) {
      return false;
    }

    const stationData = state.stationReviews[stationId];
    if (!stationData?.data) {
      return false;
    }

    return stationData.data.some((review) => isSameUser(review, userId));
  },

  // Helper: Get current user's review for this station
  getUserReview: (stationId) => {
    const state = get();
    const user = useAuthStore.getState().user;
    const userId = resolveUserId(user);

    if (!userId || !stationId) {
      return null;
    }

    const stationData = state.stationReviews[stationId];
    if (!stationData?.data) {
      return null;
    }

    return (
      stationData.data.find((review) => isSameUser(review, userId)) || null
    );
  },

  clearError: () => set({ error: null }),
}));

export default useReviewStore;
