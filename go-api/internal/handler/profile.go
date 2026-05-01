package handler

import (
	"errors"
	"net/http"

	"github.com/adnanshoukfeh/movie-club-hub/go-api/internal/service"
)

type updateProfileRequest struct {
	LetterboxdUsername string `json:"letterboxd_username"`
}

func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	viewerID, ok := h.sm.GetUserID(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	targetID, err := pathInt(r, "userId")
	if err != nil {
		writeError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	profile, err := h.profileSvc.GetProfile(r.Context(), targetID, int32(viewerID))
	if err != nil {
		switch {
		case errors.Is(err, service.ErrProfileNotFound):
			writeError(w, http.StatusNotFound, "User not found")
		case errors.Is(err, service.ErrProfileAccessDenied):
			writeError(w, http.StatusForbidden, "You don't have access to this profile")
		default:
			writeError(w, http.StatusInternalServerError, "Failed to get profile")
		}
		return
	}

	writeJSON(w, http.StatusOK, profile)
}

func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.sm.GetUserID(r)
	if !ok {
		writeError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	var req updateProfileRequest
	if err := decodeBody(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if _, err := h.profileSvc.UpdateLetterboxdUsername(r.Context(), int32(userID), req.LetterboxdUsername); err != nil {
		if errors.Is(err, service.ErrInvalidLetterboxd) {
			writeError(w, http.StatusBadRequest, "Invalid Letterboxd username. Use only letters, numbers, and underscores (max 50 characters).")
			return
		}
		writeError(w, http.StatusInternalServerError, "Failed to update profile")
		return
	}

	writeMessage(w, http.StatusOK, "Profile updated")
}
