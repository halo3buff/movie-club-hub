package handler

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"time"
)

// detectImageType inspects the first bytes of a file and returns its MIME type
// and canonical extension if it is one of the allowed image formats. HEIC/HEIF
// detection is hand-rolled because Go's stdlib does not sniff them.
func detectImageType(head []byte) (mimeType, ext string, ok bool) {
	if len(head) >= 12 && bytes.Equal(head[4:8], []byte("ftyp")) {
		brand := string(head[8:12])
		switch brand {
		case "heic", "heix", "heis", "hevc", "hevx", "heim":
			return "image/heic", ".heic", true
		case "mif1", "msf1", "heif":
			return "image/heif", ".heif", true
		}
	}
	switch http.DetectContentType(head) {
	case "image/png":
		return "image/png", ".png", true
	case "image/jpeg":
		return "image/jpeg", ".jpg", true
	case "image/gif":
		return "image/gif", ".gif", true
	case "image/webp":
		return "image/webp", ".webp", true
	}
	return "", "", false
}

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
