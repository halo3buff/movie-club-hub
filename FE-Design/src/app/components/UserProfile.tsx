// FE-Design/src/app/components/UserProfile.tsx
import { useParams, Link } from "react-router";
import { ArrowLeft, Star, Film, MessageSquare, ExternalLink, Edit2, Check, X } from "lucide-react";
import { useState } from "react";
import { VHSNoise } from "./VHSNoise";

// TODO: Replace with actual API call when backend is connected
const mockProfile = {
  id: 1,
  username: "sarah_chen",
  avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  letterboxd_username: "sarahchen",
  stats: {
    avg_rating: 4.2,
    total_watched: 47,
    total_reviews: 12,
    top_genres: ["Drama", "Thriller", "Sci-Fi"],
  },
  recent_activity: [
    {
      film_id: 1,
      title: "Parasite",
      year: 2019,
      poster_url: "https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=400&h=600&fit=crop",
      rating: 5.0,
      review: "Brilliant social commentary wrapped in a thrilling narrative.",
      watched_at: "2026-04-25T18:00:00Z",
    },
    {
      film_id: 2,
      title: "The Grand Budapest Hotel",
      year: 2014,
      poster_url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop",
      rating: 4.5,
      review: null,
      watched_at: "2026-04-20T14:30:00Z",
    },
  ],
  is_own_profile: false,
};

export function UserProfile() {
  const { userId } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [letterboxdInput, setLetterboxdInput] = useState(mockProfile.letterboxd_username || "");

  // TODO: Fetch profile from API using userId
  const profile = mockProfile;

  const handleSave = () => {
    // TODO: Call PATCH /api/me/profile
    setIsEditing(false);
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    return (
      <span className="text-[#FDB913]">
        {"★".repeat(fullStars)}
        {hasHalf && "½"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#000814] relative">
      <VHSNoise />

      {/* Header */}
      <header className="border-b-4 border-[#FDB913] sticky top-0 z-20 bg-[#003087]">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link to="/" className="text-white hover:text-[#FDB913] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-black text-[#FDB913] uppercase">Profile</h1>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto">
        {/* Desktop: Two Column / Mobile: Single Column */}
        <div className="md:flex md:gap-8">

          {/* Left Column: User Info & Stats */}
          <div className="md:w-2/5">
            {/* User Info Card */}
            <div className="bg-[#001d3d] border-4 border-[#FDB913] p-6 mb-6">
              {/* Mobile: Centered / Desktop: Left-aligned */}
              <div className="text-center md:text-left">
                <img
                  src={profile.avatar_url || ""}
                  alt={profile.username}
                  className="w-24 h-24 rounded-full border-4 border-[#FDB913] mx-auto md:mx-0 mb-4"
                />
                <h2 className="text-2xl font-black text-[#FDB913] uppercase mb-2">
                  {profile.username}
                </h2>

                {/* Letterboxd Link */}
                {isEditing ? (
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <input
                      type="text"
                      value={letterboxdInput}
                      onChange={(e) => setLetterboxdInput(e.target.value)}
                      placeholder="Letterboxd username"
                      className="bg-[#003087] text-white px-3 py-1 border-2 border-white/30 focus:border-[#FDB913] outline-none text-sm"
                    />
                    <button onClick={handleSave} className="p-1 text-[#FDB913] hover:bg-[#003087]">
                      <Check className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsEditing(false)} className="p-1 text-white/50 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : profile.letterboxd_username ? (
                  <a
                    href={`https://letterboxd.com/${profile.letterboxd_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm bg-[#E64A19] text-white px-3 py-1 hover:bg-[#FF5722] transition-colors"
                  >
                    <span>letterboxd</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : profile.is_own_profile ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-white/50 hover:text-[#FDB913] flex items-center gap-1 mx-auto md:mx-0"
                  >
                    <Edit2 className="w-3 h-3" />
                    Link your Letterboxd
                  </button>
                ) : null}

                {profile.is_own_profile && !isEditing && profile.letterboxd_username && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-2 text-xs text-white/30 hover:text-white/50"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-[#003087] border-2 border-[#FDB913] p-4 text-center">
                <div className="text-2xl font-black text-[#FDB913]">
                  {profile.stats.avg_rating.toFixed(1)}
                </div>
                <div className="text-xs text-white/70 uppercase font-bold">Avg Rating</div>
              </div>
              <div className="bg-[#003087] border-2 border-white/20 p-4 text-center">
                <div className="text-2xl font-black text-white flex items-center justify-center gap-1">
                  <Film className="w-5 h-5" />
                  {profile.stats.total_watched}
                </div>
                <div className="text-xs text-white/70 uppercase font-bold">Watched</div>
              </div>
              <div className="bg-[#003087] border-2 border-white/20 p-4 text-center">
                <div className="text-2xl font-black text-white flex items-center justify-center gap-1">
                  <MessageSquare className="w-5 h-5" />
                  {profile.stats.total_reviews}
                </div>
                <div className="text-xs text-white/70 uppercase font-bold">Reviews</div>
              </div>
            </div>

            {/* Top Genres */}
            {profile.stats.top_genres.length > 0 && (
              <div className="mb-6 md:mb-0">
                <h3 className="text-xs text-white/70 uppercase font-bold mb-2">Top Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.stats.top_genres.map((genre, i) => (
                    <span
                      key={genre}
                      className={`px-3 py-1 text-sm font-bold uppercase ${
                        i === 0
                          ? "bg-[#003087] text-[#FDB913] border border-[#FDB913]"
                          : "bg-[#003087] text-white border border-white/30"
                      }`}
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Recent Activity */}
          <div className="md:w-3/5">
            <h3 className="text-xs text-white/70 uppercase font-bold mb-4">Recent Activity</h3>

            {profile.recent_activity.length === 0 ? (
              <div className="bg-[#001d3d] border-4 border-[#003087] p-8 text-center">
                <Film className="w-12 h-12 text-[#003087] mx-auto mb-3" />
                <p className="text-white/50 font-bold">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {profile.recent_activity.map((item) => (
                  <div
                    key={item.film_id}
                    className="bg-[#001d3d] border-4 border-[#003087] hover:border-[#FDB913] transition-colors p-4"
                  >
                    <div className="flex gap-4">
                      <img
                        src={item.poster_url || ""}
                        alt={item.title}
                        className="w-16 h-24 object-cover border-2 border-[#FDB913]"
                      />
                      <div className="flex-1">
                        <h4 className="font-black text-white uppercase">{item.title}</h4>
                        <p className="text-sm text-white/70 mb-1">{item.year}</p>
                        <div className="text-lg">{renderStars(item.rating)}</div>
                        {item.review && (
                          <p className="text-sm text-white/80 mt-2 line-clamp-2">{item.review}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
