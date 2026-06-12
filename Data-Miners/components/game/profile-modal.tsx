"use client"

import { useEffect, useMemo, useState } from "react"
import { User, Star, Coins, Trophy, Sparkles, Lock, Unlock } from "lucide-react"
import axios from "@/lib/axios"
import { GameModal } from "./game-modal"
import { calculateLevelInfo } from "@/lib/level-utils"
import type { ProfileResponse, Cosmetic, CosmeticSet, EquippedCosmeticsRequest } from "@/lib/api-types"

type CosmeticTypeKey = "profile_picture" | "frame" | "card" | "title"

const cosmeticSections: Array<{ key: CosmeticTypeKey; label: string }> = [
  { key: "profile_picture", label: "PROFILE PICTURE" },
  { key: "frame", label: "FRAME" },
  { key: "card", label: "CARD" },
  { key: "title", label: "TITLE" },
]

const cosmeticFieldKeys: Record<CosmeticTypeKey, string> = {
  profile_picture: "equipped_profile_picture_id",
  frame: "equipped_frame_id",
  card: "equipped_card_id",
  title: "equipped_title_id",
}

type SelectedCosmetics = Record<CosmeticTypeKey, number | null>

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCosmetics, setSelectedCosmetics] = useState<SelectedCosmetics>({
    profile_picture: null,
    frame: null,
    card: null,
    title: null,
  })
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
      const response = await axios.get<ProfileResponse>("/api/profile")
      setProfileData(response.data)
      setSelectedCosmetics({
        profile_picture: response.data.user.equipped_profile_picture?.id || null,
        frame: response.data.user.equipped_frame?.id || null,
        card: response.data.user.equipped_card?.id || null,
        title: response.data.user.equipped_title?.id || null,
      })
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
      const payload: EquippedCosmeticsRequest = {
        equipped_profile_picture_id: selectedCosmetics.profile_picture,
        equipped_frame_id: selectedCosmetics.frame,
        equipped_card_id: selectedCosmetics.card,
        equipped_title_id: selectedCosmetics.title,
      }
      await axios.put<EquippedCosmeticsRequest>(
        "/api/profile/equipped-cosmetics",
        payload
      )
      await fetchProfileData()
    } catch (err) {
      console.error("Failed to update equipped cosmetics:", err)
      setSaveError("Failed to update equipped cosmetics")
    } finally {
      setSaving(false)
    }
  }

  const handleSelectCosmetic = (type: CosmeticTypeKey, id: number | null) => {
    setSelectedCosmetics((current) => ({ ...current, [type]: id }))
  }

  const getCosmeticsByType = (type: CosmeticTypeKey) =>
    profileData?.user_cosmetics.filter(
      (cosmetic) => cosmetic.cosmetic_type.name === type && cosmetic.unlocked
    ) ?? []

  const levelInfo = useMemo(() => {
    if (!profileData) return null
    return calculateLevelInfo(profileData.user.experience_points)
  }, [profileData?.user.experience_points])

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
                    <div className="font-serif italic text-xs text-white/40 mb-1">LEVEL</div>
                    <div>
                      {levelInfo && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span className="font-mono text-sm text-[#d4a853]">Lv {levelInfo.level}</span>
                          </div>

                          <div className="mt-2">
                            <div className="w-full bg-white/10 h-2 rounded overflow-hidden">
                              <div
                                className="h-2 bg-[#d4a853] transition-all"
                                style={{ width: `${Math.round(levelInfo.progress * 100)}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-xs text-white/40 mt-1">
                              <span className="font-mono">{levelInfo.xpIntoLevel} / {levelInfo.xpForNext} XP</span>
                              <span>{levelInfo.xpRemaining} XP to next</span>
                            </div>
                          </div>
                        </div>
                      )}
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

                {cosmeticSections.map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <div className="font-serif italic text-xs text-white/40">{label}</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        onClick={() => handleSelectCosmetic(key, null)}
                        className={`p-2 border text-center ${
                          selectedCosmetics[key] === null
                            ? "border-[#d4a853] bg-[#d4a853]/10"
                            : "border-white/20 bg-black/30 hover:border-white/40"
                        }`}
                      >
                        <div className="font-serif text-xs text-white/70">None</div>
                      </button>
                      {getCosmeticsByType(key).map((cosmetic) => (
                        <button
                          key={cosmetic.id}
                          onClick={() => handleSelectCosmetic(key, cosmetic.id)}
                          className={`p-2 border text-center ${
                            selectedCosmetics[key] === cosmetic.id
                              ? "border-[#d4a853] bg-[#d4a853]/10"
                              : "border-white/20 bg-black/30 hover:border-white/40"
                          }`}
                        >
                          <div className="font-serif text-xs text-white/70">{cosmetic.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

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
