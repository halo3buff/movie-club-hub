import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Check } from "lucide-react";
import { VHSNoise } from "./VHSNoise";

export function Settings() {
  // TODO: Fetch from API when connected
  const [movieLinkPreference, setMovieLinkPreference] = useState<"letterboxd" | "imdb">("letterboxd");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // TODO: Call PATCH /api/me/settings
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#000814] relative">
      <VHSNoise />

      <header className="border-b-4 border-[#FDB913] sticky top-0 z-20 bg-[#003087]">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link to="/" className="text-white hover:text-[#FDB913] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-black text-[#FDB913] uppercase">Settings</h1>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-2xl mx-auto">
        <div className="bg-[#001d3d] border-4 border-[#FDB913] p-6">
          <h2 className="text-lg font-black text-[#FDB913] uppercase mb-6">Movie Links</h2>

          <p className="text-white/70 text-sm mb-4">
            Choose where movie titles link to when clicked:
          </p>

          <div className="space-y-3 mb-6">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="movieLinkPreference"
                value="letterboxd"
                checked={movieLinkPreference === "letterboxd"}
                onChange={() => setMovieLinkPreference("letterboxd")}
                className="w-5 h-5 accent-[#FDB913]"
              />
              <div>
                <span className="font-bold text-white group-hover:text-[#FDB913] transition-colors">
                  Letterboxd
                </span>
                <span className="text-white/50 text-sm ml-2">(default)</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="movieLinkPreference"
                value="imdb"
                checked={movieLinkPreference === "imdb"}
                onChange={() => setMovieLinkPreference("imdb")}
                className="w-5 h-5 accent-[#FDB913]"
              />
              <span className="font-bold text-white group-hover:text-[#FDB913] transition-colors">
                IMDB
              </span>
            </label>
          </div>

          <button
            onClick={handleSave}
            className="px-6 py-2 bg-[#FDB913] text-[#003087] font-black uppercase hover:bg-[#003087] hover:text-[#FDB913] border-2 border-[#FDB913] transition-all flex items-center gap-2"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved
              </>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
