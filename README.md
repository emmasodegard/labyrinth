Game features implemented

Implemented:

** The starting level has an empty slot in the surrounding wall. This slot should function as a door into the level called "aSharpPlace." Implement the door functionality so that the player can proceed to the next level.

** Create a new level (a third level) and link the unused door in "aSharpPlace" to exit into the new room.

** In "aSharpPlace," implement teleport functionality for the "♨︎" symbols. (I changed this to T) Entering one should move the player to the other.

** Ensure that when going back through a door, the player returns to the correct room.

** Make the X NPC characters perform a simple patrol (+/-2 from their starting locations).

** Create an animated splash screen using splashScreen.mjs.

- Give the NPCs stats, such as strength and hitpoints.
- Implement a simple battle system where collisions deal damage, using player and NPC stats to calculate damage dealt.
- Output battle events to the event messages displayed beneath the map.
- Have event messages remain on screen longer (currently, they only survive one update cycle).
- Create two new pickups: a health potion and poison, and include them in your level.
- When a character takes damage, briefly color the background of that character red.
- Let the player decide what the movement keys should be (or support awsd+space as well as arrows + space).

Partially implemented:
- Make the B NPC shoot projectiles when the hero is close; projectiles must be visible and move in a straight line.
    I implemented the boss NPC (B) shooting visible projectiles that move in a straight line. However, the shooting is currently based on a random chance rather than the hero's proximity.
