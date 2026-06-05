"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { User, Star, Coins, Trophy, Sparkles, Lock, Unlock } from "lucide-react"
import axios from "@/lib/axios"
import { GameModal } from "./game-modal"

interface Cosmetic {
  id: number
  name: string
  experience_unlock: number | null
  credits_unlock: number | null
  unlocked: boolean
  cosmetic_type: {
    id: number
    name: string
  }
}

interface Set {
  id: number
  set_name: string
  cosmetics: Cosmetic[]
}

interface ProfileData {
  user: {
    id: number
    name: string
    email: string
    experience_points: number
    credits: number
    rank_score: number
    equipped_profile_picture?: {
      id: number
      name: string
      cosmetic_type: string
    }
    equipped_frame?: {
      id: number
      name: string
      cosmetic_type: string
    }
    equipped_card?: {
      id: number
      name: string
      cosmetic_type: string
    }
    equipped_title?: {
      id: number
      name: string
      cosmetic_type: string
    }
  }
  sets: Set[]
  user_cosmetics: Cosmetic[]
}

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedProfilePicture, setSelectedProfilePicture] = useState<number | null>(null)
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null)
  const [selectedCard, setSelectedCard] = useState<number | null>(null)
  const [selectedTitle, setSelectedTitle] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchProfileData()
    }
  }, [isOpen])

  const fetchProfileData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get("/api/profile")
      setProfileData(response.data)
      setSelectedProfilePicture(response.data.user.equipped_profile_picture?.id || null)
      setSelectedFrame(response.data.user.equipped_frame?.id || null)
      setSelectedCard(response.data.user.equipped_card?.id || null)
      setSelectedTitle(response.data.user.equipped_title?.id || null)
    } catch (err) {
      console.error("Failed to fetch profile data:", err)
      setError("Failed to load profile data")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEquippedCosmetics = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      await axios.put("/api/profile/equipped-cosmetics", {
        equipped_profile_picture_id: selectedProfilePicture,
        equipped_frame_id: selectedFrame,
        equipped_card_id: selectedCard,
        equipped_title_id: selectedTitle,
      })
      await fetchProfileData()
    } catch (err) {
      console.error("Failed to update equipped cosmetics:", err)
      setSaveError("Failed to update equipped cosmetics")
    } finally {
      setSaving(false)
    }
  }

  const getCosmeticsByType = (type: string) => {
    if (!profileData) return []
    return profileData.user_cosmetics.filter(
      (cosmetic) => cosmetic.cosmetic_type.name === type && cosmetic.unlocked
    )
  }

  return (
    <GameModal
      isOpen={isOpen}
      onClose={onClose}
      title="Profile"
      maxWidth="max-w-2xl"
      className="max-h-[90vh] flex flex-col"
      closeLabel="Close profile"
    >
      <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="font-serif italic text-white/50">Loading profile data...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-400 font-serif italic">{error}</div>
            </div>
          ) : profileData ? (
            <div className="space-y-6">
              {/* User Information */}
              <div className="ark-card p-4 space-y-3">
                <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                  <User className="w-5 h-5 text-[#d4a853]" />
                  <h3 className="font-heading text-sm tracking-wider text-white/90">DIRECTOR PROFILE</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <div className="font-serif italic text-xs text-white/40 mb-1">NAME</div>
                    <div className="font-heading text-sm text-white/90">{profileData.user.name}</div>
                  </div>
                  <div>
                    <div className="font-serif italic text-xs text-white/40 mb-1">EXPERIENCE</div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="font-mono text-sm text-[#d4a853]">{profileData.user.experience_points}</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-serif italic text-xs text-white/40 mb-1">CREDITS</div>
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span className="font-mono text-sm text-[#d4a853]">{profileData.user.credits}</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="font-serif italic text-xs text-white/40 mb-1">RANK SCORE</div>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span className="font-mono text-sm text-[#d4a853]">{profileData.user.rank_score}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Customization */}
              <div className="ark-card p-4 space-y-3">
                <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                  <Sparkles className="w-5 h-5 text-[#d4a853]" />
                  <h3 className="font-heading text-sm tracking-wider text-white/90">PROFILE CUSTOMIZATION</h3>
                </div>

                {/* Profile Picture */}
                <div className="space-y-2">
                  <div className="font-serif italic text-xs text-white/40">PROFILE PICTURE</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => setSelectedProfilePicture(null)}
                      className={`p-2 border text-center ${
                        selectedProfilePicture === null
                          ? "border-[#d4a853] bg-[#d4a853]/10"
                          : "border-white/20 bg-black/30 hover:border-white/40"
                      }`}
                    >
                      <div className="font-serif text-xs text-white/70">None</div>
                    </button>
                    {getCosmeticsByType("profile_picture").map((cosmetic) => (
                      <button
                        key={cosmetic.id}
                        onClick={() => setSelectedProfilePicture(cosmetic.id)}
                        className={`p-2 border text-center ${
                          selectedProfilePicture === cosmetic.id
                            ? "border-[#d4a853] bg-[#d4a853]/10"
                            : "border-white/20 bg-black/30 hover:border-white/40"
                        }`}
                      >
                        <div className="font-serif text-xs text-white/70">{cosmetic.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Frame */}
                <div className="space-y-2">
                  <div className="font-serif italic text-xs text-white/40">FRAME</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => setSelectedFrame(null)}
                      className={`p-2 border text-center ${
                        selectedFrame === null
                          ? "border-[#d4a853] bg-[#d4a853]/10"
                          : "border-white/20 bg-black/30 hover:border-white/40"
                      }`}
                    >
                      <div className="font-serif text-xs text-white/70">None</div>
                    </button>
                    {getCosmeticsByType("frame").map((cosmetic) => (
                      <button
                        key={cosmetic.id}
                        onClick={() => setSelectedFrame(cosmetic.id)}
                        className={`p-2 border text-center ${
                          selectedFrame === cosmetic.id
                            ? "border-[#d4a853] bg-[#d4a853]/10"
                            : "border-white/20 bg-black/30 hover:border-white/40"
                        }`}
                      >
                        <div className="font-serif text-xs text-white/70">{cosmetic.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card */}
                <div className="space-y-2">
                  <div className="font-serif italic text-xs text-white/40">CARD</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => setSelectedCard(null)}
                      className={`p-2 border text-center ${
                        selectedCard === null
                          ? "border-[#d4a853] bg-[#d4a853]/10"
                          : "border-white/20 bg-black/30 hover:border-white/40"
                      }`}
                    >
                      <div className="font-serif text-xs text-white/70">None</div>
                    </button>
                    {getCosmeticsByType("card").map((cosmetic) => (
                      <button
                        key={cosmetic.id}
                        onClick={() => setSelectedCard(cosmetic.id)}
                        className={`p-2 border text-center ${
                          selectedCard === cosmetic.id
                            ? "border-[#d4a853] bg-[#d4a853]/10"
                            : "border-white/20 bg-black/30 hover:border-white/40"
                        }`}
                      >
                        <div className="font-serif text-xs text-white/70">{cosmetic.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <div className="font-serif italic text-xs text-white/40">TITLE</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => setSelectedTitle(null)}
                      className={`p-2 border text-center ${
                        selectedTitle === null
                          ? "border-[#d4a853] bg-[#d4a853]/10"
                          : "border-white/20 bg-black/30 hover:border-white/40"
                      }`}
                    >
                      <div className="font-serif text-xs text-white/70">None</div>
                    </button>
                    {getCosmeticsByType("title").map((cosmetic) => (
                      <button
                        key={cosmetic.id}
                        onClick={() => setSelectedTitle(cosmetic.id)}
                        className={`p-2 border text-center ${
                          selectedTitle === cosmetic.id
                            ? "border-[#d4a853] bg-[#d4a853]/10"
                            : "border-white/20 bg-black/30 hover:border-white/40"
                        }`}
                      >
                        <div className="font-serif text-xs text-white/70">{cosmetic.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-2">
                  <button
                    onClick={handleSaveEquippedCosmetics}
                    disabled={saving}
                    className="w-full py-2 px-4 bg-[#d4a853] hover:bg-[#b8933f] text-black font-heading text-sm tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  {saveError && (
                    <div className="mt-2 text-center text-red-400 font-serif text-xs">{saveError}</div>
                  )}
                </div>
              </div>

              {/* Sets */}
              {profileData.sets.length > 0 && (
                <div className="ark-card p-4 space-y-3">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                    <Sparkles className="w-5 h-5 text-[#d4a853]" />
                    <h3 className="font-heading text-sm tracking-wider text-white/90">COSMETIC SETS</h3>
                  </div>
                  <div className="space-y-3">
                    {profileData.sets.map((set) => (
                      <div key={set.id} className="bg-black/30 border border-white/10 p-3">
                        <div className="font-heading text-xs text-white/90 mb-2">{set.set_name}</div>
                        {set.cosmetics.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {set.cosmetics.map((cosmetic) => (
                              <div
                                key={cosmetic.id}
                                className="bg-black/50 border border-white/20 px-2 py-1 flex items-center gap-1.5"
                              >
                                <Sparkles className="w-3 h-3 text-[#d4a853]" />
                                <span className="font-serif text-xs text-white/70">{cosmetic.name}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="font-serif italic text-xs text-white/30">No cosmetics in this set</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User Cosmetics */}
              {profileData.user_cosmetics.length > 0 && (
                <div className="ark-card p-4 space-y-3">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                    <Sparkles className="w-5 h-5 text-[#d4a853]" />
                    <h3 className="font-heading text-sm tracking-wider text-white/90">UNLOCKED COSMETICS</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {profileData.user_cosmetics.map((cosmetic) => (
                      <div
                        key={cosmetic.id}
                        className={`bg-black/30 border p-3 ${
                          cosmetic.unlocked ? "border-[#d4a853]/30" : "border-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {cosmetic.unlocked ? (
                              <Unlock className="w-3 h-3 text-[#d4a853]" />
                            ) : (
                              <Lock className="w-3 h-3 text-white/30" />
                            )}
                            <span className="font-heading text-xs text-white/90">{cosmetic.name}</span>
                          </div>
                          <span className="font-serif text-[10px] text-white/40">{cosmetic.cosmetic_type.name}</span>
                        </div>
                        <div className="space-y-1">
                          {cosmetic.experience_unlock && (
                            <div className="flex items-center gap-2">
                              <Star className="w-3 h-3 text-yellow-400/50" />
                              <span className="font-mono text-[10px] text-white/50">
                                {cosmetic.experience_unlock} XP
                              </span>
                            </div>
                          )}
                          {cosmetic.credits_unlock && (
                            <div className="flex items-center gap-2">
                              <Coins className="w-3 h-3 text-yellow-400/50" />
                              <span className="font-mono text-[10px] text-white/50">
                                {cosmetic.credits_unlock} Credits
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profileData.sets.length === 0 && profileData.user_cosmetics.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <div className="font-serif italic text-white/30">No cosmetics or sets available</div>
                </div>
              )}
            </div>
          ) : null}
      </div>
    </GameModal>
  )
}
