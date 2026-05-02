package handler

import (
	"regexp"
	"testing"
	"time"
)

func TestNewRequestID_FormatAndUniqueness(t *testing.T) {
	pattern := regexp.MustCompile(`^\d{8}-\d{6}-[0-9a-f]{6}$`)

	id1 := newRequestID(time.Date(2026, 5, 2, 14, 30, 22, 0, time.UTC))
	if !pattern.MatchString(id1) {
		t.Errorf("id1 %q does not match %s", id1, pattern)
	}
	if got := id1[:15]; got != "20260502-143022" {
		t.Errorf("timestamp prefix: got %q, want %q", got, "20260502-143022")
	}

	id2 := newRequestID(time.Date(2026, 5, 2, 14, 30, 22, 0, time.UTC))
	if id1 == id2 {
		t.Errorf("expected distinct suffixes, got %q twice", id1)
	}
}
