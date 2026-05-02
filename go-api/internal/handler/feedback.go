package handler

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"time"
)

// feedbackStorage is the narrow GCS surface SubmitFeedback needs.
// *service.GCSService satisfies this interface.
type feedbackStorage interface {
	IsConfigured() bool
	UploadFromReader(ctx context.Context, objectName, contentType string, r io.Reader) (string, error)
}

// newRequestID returns a folder-safe ID of the form YYYYMMDD-HHMMSS-<6hex>.
// The 6-hex suffix prevents collisions when two users submit in the same second.
func newRequestID(now time.Time) string {
	var b [3]byte
	if _, err := rand.Read(b[:]); err != nil {
		nanos := now.UnixNano()
		return fmt.Sprintf("%s-%06x", now.UTC().Format("20060102-150405"), nanos&0xFFFFFF)
	}
	return fmt.Sprintf("%s-%s", now.UTC().Format("20060102-150405"), hex.EncodeToString(b[:]))
}
