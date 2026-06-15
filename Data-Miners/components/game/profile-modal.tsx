"use client"

import { useEffect, useMemo, useState } from "react"
import { User, Star, Coins, Trophy, Sparkles, Lock, Unlock } from "lucide-react"
import axios from "@/lib/axios"
import { GameModal } from "./game-modal"
import { calculateLevelInfo } from "@/lib/level-utils"
import type { ProfileResponse, Cosmetic, CosmeticSet, EquippedCosmeticsRequest, CreateSetRequest, SwitchEquippedSetRequest, AddCosmeticToSetRequest, RemoveCosmeticFromSetRequest } from "@/lib/api-types"

type CosmeticTypeKey = "profile_picture" | "frame" | "card" | "title"

const cosmeticSections: Array<{ key: CosmeticTypeKey; label: string }> = [
  { key: "profile_picture", label: "PROFILE PICTURE" },
  { key: "frame", label: "FRAME" },
  { key: "card", label: "CARD" },
  { key: "title", label: "TITLE" },
]

const cosmeticTypeNames: Record<CosmeticTypeKey, string> = {
  profile_picture: "Profile Picture",
  frame: "Profile Frame",
  card: "Profile Card",
  title: "Profile Title",
}

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

  // Ensure selected cosmetics are never null - default to first unlocked cosmetic
  useEffect(() => {
    if (profileData) {
      setSelectedCosmetics((current) => {
        const updated: SelectedCosmetics = { ...current }
        cosmeticSections.forEach(({ key }) => {
          if (!updated[key]) {
            const cosmetics = getCosmeticsByType(key)
            if (cosmetics.length > 0) {
              updated[key] = cosmetics[0].id
            }
          }
        })
        return updated
      })
    }
  }, [profileData])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showCreateSet, setShowCreateSet] = useState(false)
  const [newSetName, setNewSetName] = useState("")
  const [creatingSet, setCreatingSet] = useState(false)
  const [createSetError, setCreateSetError] = useState<string | null>(null)
  const [editingSetId, setEditingSetId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'sets' | 'quick-edit'>('sets')

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
      (cosmetic) => cosmetic.cosmetic_type.name === cosmeticTypeNames[type] && cosmetic.unlocked
    ) ?? []

  const handleCreateSet = async () => {
    if (!newSetName.trim()) {
      setCreateSetError("Set name is required")
      return
    }

    // Validate that we have exactly 4 cosmetics selected (one per type)
    const selectedCosmeticIds = Object.values(selectedCosmetics).filter((id): id is number => id !== null)
    if (selectedCosmeticIds.length !== 4) {
      setCreateSetError("Set must contain exactly one cosmetic of each type")
      return
    }

    setCreatingSet(true)
    setCreateSetError(null)
    try {
      const payload: CreateSetRequest = { set_name: newSetName, cosmetic_ids: selectedCosmeticIds }
      await axios.post("/api/sets", payload)
      setNewSetName("")
      setShowCreateSet(false)
      await fetchProfileData()
    } catch (err) {
      console.error("Failed to create set:", err)
      setCreateSetError("Failed to create set")
    } finally {
      setCreatingSet(false)
    }
  }

  const handleSwitchEquippedSet = async (setId: number | null) => {
    try {
      const payload: SwitchEquippedSetRequest = { equipped_set_id: setId }
      await axios.put("/api/sets/equipped", payload)
      await fetchProfileData()
    } catch (err) {
      console.error("Failed to switch equipped set:", err)
    }
  }

  const handleAddCosmeticToSet = async (set_id: number, cosmetic_id: number) => {
    try {
      const payload: AddCosmeticToSetRequest = { set_id, cosmetic_id }
      await axios.post("/api/sets/add-cosmetic", payload)
      await fetchProfileData()
    } catch (err) {
      console.error("Failed to add cosmetic to set:", err)
    }
  }

  const handleRemoveCosmeticFromSet = async (set_id: number, cosmetic_id: number) => {
    try {
      const payload: RemoveCosmeticFromSetRequest = { set_id, cosmetic_id }
      await axios.post("/api/sets/remove-cosmetic", payload)
      await fetchProfileData()
    } catch (err) {
      console.error("Failed to remove cosmetic from set:", err)
    }
  }

  const handleDeleteSet = async (set_id: number) => {
    if (!confirm("Are you sure you want to delete this set?")) return
    try {
      await axios.delete(`/api/sets/${set_id}`)
      await fetchProfileData()
    } catch (err) {
      console.error("Failed to delete set:", err)
    }
  }

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
              <div className="font-serif italic text-foreground/50">Loading profile data...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-400 font-serif italic">{error}</div>
            </div>
          ) : profileData ? (
            <div className="space-y-6">
              {/* User Information */}
              <div className="ark-card p-4 space-y-3">
                <div className="flex items-center gap-3 border-b border-border pb-3">
                  <User className="w-5 h-5 text-ark-gold" />
                  <h3 className="font-heading text-sm tracking-wider text-foreground/90">DIRECTOR PROFILE</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <div className="font-serif italic text-xs text-foreground/40 mb-1">NAME</div>
                    <div className="font-heading text-sm text-foreground/90">{profileData.user.name}</div>
                  </div>
                  <div>
                    <div className="font-serif italic text-xs text-foreground/40 mb-1">LEVEL</div>
                    <div>
                      {levelInfo && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span className="font-mono text-sm text-ark-gold">Lv {levelInfo.level}</span>
                          </div>

                          <div className="mt-2">
                            <div className="w-full bg-foreground/10 h-2 rounded overflow-hidden">
                              <div
                                className="h-2 bg-ark-gold transition-all"
                                style={{ width: `${Math.round(levelInfo.progress * 100)}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-xs text-foreground/40 mt-1">
                              <span className="font-mono">{levelInfo.xpIntoLevel} / {levelInfo.xpForNext} XP</span>
                              <span>{levelInfo.xpRemaining} XP to next</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="font-serif italic text-xs text-foreground/40 mb-1">CREDITS</div>
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span className="font-mono text-sm text-ark-gold">{profileData.user.credits}</span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="font-serif italic text-xs text-foreground/40 mb-1">RANK SCORE</div>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-400" />
                      <span className="font-mono text-sm text-ark-gold">{profileData.user.rank_score}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabbed Interface for Cosmetic Management */}
              <div className="ark-card p-4 space-y-3">
                {/* Tab Navigation */}
                <div className="flex items-center gap-3 border-b border-border pb-3">
                  <Sparkles className="w-5 h-5 text-ark-gold" />
                  <div className="flex gap-4">
                    <button
                      onClick={() => setActiveTab('sets')}
                      className={`font-heading text-sm tracking-wider ${
                        activeTab === 'sets' ? 'text-ark-gold' : 'text-foreground/90 hover:text-foreground'
                      }`}
                    >
                      SETS
                    </button>
                    <button
                      onClick={() => setActiveTab('quick-edit')}
                      className={`font-heading text-sm tracking-wider ${
                        activeTab === 'quick-edit' ? 'text-ark-gold' : 'text-foreground/90 hover:text-foreground'
                      }`}
                    >
                      QUICK EDIT
                    </button>
                  </div>
                </div>

                {/* Sets Tab (Primary) */}
                {activeTab === 'sets' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-serif italic text-xs text-foreground/40">Quick-swap between cosmetic sets</div>
                      <button
                        onClick={() => setShowCreateSet(!showCreateSet)}
                        className="ark-button px-3 py-1 text-xs font-heading tracking-wider"
                      >
                        {showCreateSet ? "CANCEL" : "NEW SET"}
                      </button>
                    </div>

                    {/* Create Set Form */}
                    {showCreateSet && (
                      <div className="bg-card border border-border p-3 space-y-3">
                        <div>
                          <div className="font-serif italic text-xs text-foreground/40 mb-1">SET NAME</div>
                          <input
                            type="text"
                            value={newSetName}
                            onChange={(e) => setNewSetName(e.target.value)}
                            placeholder="Enter set name..."
                            className="w-full bg-card/80 border border-border px-3 py-2 text-xs text-foreground font-heading focus:outline-none focus:border-ark-gold/50"
                            maxLength={255}
                          />
                        </div>
                        <div className="font-serif italic text-xs text-foreground/40">
                          Using current Quick Edit selections
                        </div>
                        {createSetError && (
                          <div className="text-red-400 font-serif text-xs">{createSetError}</div>
                        )}
                        <button
                          onClick={handleCreateSet}
                          disabled={creatingSet || !newSetName.trim()}
                          className="w-full py-2 px-4 bg-ark-gold hover:bg-ark-gold/80 text-black font-heading text-sm tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {creatingSet ? "Creating..." : "Create Set"}
                        </button>
                      </div>
                    )}

                    {/* Sets List */}
                    {profileData.sets.length > 0 ? (
                      <div className="space-y-3">
                        {profileData.sets.map((set) => (
                          <div
                            key={set.id}
                            className={`bg-card border p-3 ${
                              profileData.user.equipped_set_id === set.id
                                ? "border-ark-gold/50"
                                : "border-border"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    profileData.user.equipped_set_id === set.id
                                      ? "bg-ark-gold"
                                      : "bg-foreground/30"
                                  }`}
                                />
                                <span className="font-heading text-xs text-foreground/90">{set.set_name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {profileData.user.equipped_set_id !== set.id && (
                                  <button
                                    onClick={() => handleSwitchEquippedSet(set.id)}
                                    className="ark-button px-2 py-1 text-[10px] font-heading tracking-wider"
                                  >
                                    EQUIP
                                  </button>
                                )}
                                <button
                                  onClick={() => setEditingSetId(editingSetId === set.id ? null : set.id)}
                                  className="ark-button px-2 py-1 text-[10px] font-heading tracking-wider"
                                >
                                  {editingSetId === set.id ? "CLOSE" : "EDIT"}
                                </button>
                                <button
                                  onClick={() => handleDeleteSet(set.id)}
                                  className="ark-button-danger px-2 py-1 text-[10px] font-heading tracking-wider"
                                >
                                  DELETE
                                </button>
                              </div>
                            </div>

                            {/* Edit Set - Add/Remove Cosmetics */}
                            {editingSetId === set.id && (
                              <div className="mt-3 pt-3 border-t border-border space-y-3">
                                <div>
                                  <div className="font-serif italic text-xs text-foreground/40 mb-2">ADD COSMETICS</div>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {profileData.user_cosmetics
                                      .filter((c) => c.unlocked && !set.cosmetics.some((sc) => sc.id === c.id))
                                      .map((cosmetic) => (
                                        <button
                                          key={cosmetic.id}
                                          onClick={() => handleAddCosmeticToSet(set.id, cosmetic.id)}
                                          className="p-2 border border-border bg-card hover:border-ark-gold/50 text-center"
                                        >
                                          <div className="font-serif text-xs text-foreground/70">{cosmetic.name}</div>
                                          <div className="font-serif text-[10px] text-foreground/40">{cosmetic.cosmetic_type.name}</div>
                                        </button>
                                      ))}
                                  </div>
                                </div>

                                {set.cosmetics.length > 0 && (
                                  <div>
                                    <div className="font-serif italic text-xs text-foreground/40 mb-2">REMOVE COSMETICS</div>
                                    <div className="flex flex-wrap gap-2">
                                      {set.cosmetics.map((cosmetic) => (
                                        <button
                                          key={cosmetic.id}
                                          onClick={() => handleRemoveCosmeticFromSet(set.id, cosmetic.id)}
                                          className="bg-card/80 border border-destructive/30 hover:border-destructive/60 px-2 py-1 flex items-center gap-1.5"
                                        >
                                          <span className="font-serif text-xs text-foreground/70">{cosmetic.name}</span>
                                          <span className="text-red-400 text-xs">×</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Set Cosmetics Display (when not editing) */}
                            {editingSetId !== set.id && set.cosmetics.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {set.cosmetics.map((cosmetic) => (
                                  <div
                                    key={cosmetic.id}
                                    className="bg-card/80 border border-border px-2 py-1 flex items-center gap-1.5"
                                  >
                                    <Sparkles className="w-3 h-3 text-ark-gold" />
                                    <span className="font-serif text-xs text-foreground/70">{cosmetic.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {editingSetId !== set.id && set.cosmetics.length === 0 && (
                              <div className="font-serif italic text-xs text-foreground/30">No cosmetics in this set</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Sparkles className="w-6 h-6 text-foreground/20 mx-auto mb-2" />
                        <div className="font-serif italic text-xs text-foreground/30">No sets created yet</div>
                      </div>
                    )}

                    {/* Unequip Set Button */}
                    {profileData.user.equipped_set_id && (
                      <button
                        onClick={() => handleSwitchEquippedSet(null)}
                        className="w-full py-2 px-4 bg-foreground/10 hover:bg-foreground/20 text-foreground font-heading text-sm tracking-wider border border-border"
                      >
                        UNEQUIP CURRENT SET
                      </button>
                    )}
                  </div>
                )}

                {/* Quick Edit Tab (Secondary) */}
                {activeTab === 'quick-edit' && (
                  <div className="space-y-3">
                    <div className="font-serif italic text-xs text-foreground/40">Fine-tune individual cosmetics</div>

                    {/* 4-column layout for cosmetic types */}
                    <div className="grid grid-cols-4 gap-3">
                      {cosmeticSections.map(({ key, label }) => (
                        <div key={key} className="space-y-2">
                          <div className="font-serif italic text-xs text-foreground/40 text-center">{label}</div>
                          <div className="space-y-2">
                            {getCosmeticsByType(key).map((cosmetic) => (
                              <button
                                key={cosmetic.id}
                                onClick={() => handleSelectCosmetic(key, cosmetic.id)}
                                className={`w-full p-2 border text-center ${
                                  selectedCosmetics[key] === cosmetic.id
                                    ? "border-ark-gold bg-ark-gold/10"
                                    : "border-border bg-card hover:border-border/60"
                                }`}
                              >
                                <div className="font-serif text-xs text-foreground/70">{cosmetic.name}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleSaveEquippedCosmetics}
                        disabled={saving}
                        className="w-full py-2 px-4 bg-ark-gold hover:bg-ark-gold/80 text-black font-heading text-sm tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                      {saveError && (
                        <div className="mt-2 text-center text-red-400 font-serif text-xs">{saveError}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>


              {profileData.sets.length === 0 && profileData.user_cosmetics.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles className="w-8 h-8 text-foreground/20 mx-auto mb-2" />
                  <div className="font-serif italic text-foreground/30">No cosmetics or sets available</div>
                </div>
              )}
            </div>
          ) : null}
      </div>
    </GameModal>
  )
}
