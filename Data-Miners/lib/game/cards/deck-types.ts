/**
 * Frontend representation of a user's deck.
 * Previously duplicated in DeckEditor and MainMenu.
 */
export interface UserDeck {
  id: number
  name: string
  cardIds: string[]
}
