import GameClient from "./game-client"

export default function Home() {
  return (
    <main className="h-dvh w-full overflow-hidden bg-background grid-pattern transition-colors duration-300">
      <GameClient />
    </main>
  )
}
