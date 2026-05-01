package service

import "testing"

func TestIsValidLetterboxdUsername(t *testing.T) {
	valid := []string{"sarahchen", "movie_fan_42", "a", "user123"}
	for _, u := range valid {
		if !isValidLetterboxdUsername(u) {
			t.Errorf("isValidLetterboxdUsername(%q) = false, want true", u)
		}
	}

	invalid := []string{"has space", "special!", "emoji😀", "waytoolongusernamethatexceedsfiftycharacterslimit123"}
	for _, u := range invalid {
		if isValidLetterboxdUsername(u) {
			t.Errorf("isValidLetterboxdUsername(%q) = true, want false", u)
		}
	}
}

func TestParseGenres(t *testing.T) {
	tests := []struct {
		input string
		want  []string
	}{
		{"Drama, Thriller", []string{"Drama", "Thriller"}},
		{"Action", []string{"Action"}},
		{"Comedy, Drama, Romance", []string{"Comedy", "Drama", "Romance"}},
		{"", nil},
	}
	for _, tt := range tests {
		got := parseGenres(tt.input)
		if len(got) != len(tt.want) {
			t.Errorf("parseGenres(%q) = %v, want %v", tt.input, got, tt.want)
			continue
		}
		for i := range got {
			if got[i] != tt.want[i] {
				t.Errorf("parseGenres(%q)[%d] = %q, want %q", tt.input, i, got[i], tt.want[i])
			}
		}
	}
}
