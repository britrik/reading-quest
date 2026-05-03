import {
  db,
  worldsTable,
  storiesTable,
  chaptersTable,
  shopItemsTable,
  childProfilesTable,
  ownedItemsTable,
  decorStateTable,
  type TappableWord,
} from "@workspace/db";
import { sql } from "drizzle-orm";

type ChapterSeed = {
  title: string;
  sceneImageUrl: string;
  paragraphs: string[];
  tappableWords: TappableWord[];
};

type StorySeed = {
  slug: string;
  title: string;
  summary: string;
  chapters: ChapterSeed[];
};

type WorldSeed = {
  slug: string;
  name: string;
  blurb: string;
  difficulty: number;
  difficultyLabel: string;
  thumbnailUrl: string;
  accentColor: string;
  chipColor: string;
  chipTextColor: string;
  stories: StorySeed[];
};

const FOREST_SCENE = "/images/reading-quest/scene-forest.png";

const COMMON_WORDS: Record<string, TappableWord> = {
  carefully: { key: "carefully", word: "carefully", syllables: ["care", "ful", "ly"], reaction: "Nice — that's a big one!" },
  glowing: { key: "glowing", word: "glowing", syllables: ["glow", "ing"], reaction: "You got it!" },
  clearing: { key: "clearing", word: "clearing", syllables: ["clear", "ing"], reaction: "Easy peasy!" },
  floating: { key: "floating", word: "floating", syllables: ["float", "ing"], reaction: "Smooth!" },
  quietly: { key: "quietly", word: "quietly", syllables: ["qui", "et", "ly"], reaction: "Tricky one — well done!" },
  stardust: { key: "stardust", word: "stardust", syllables: ["star", "dust"], reaction: "Sparkly word!" },
  behind: { key: "behind", word: "behind", syllables: ["be", "hind"], reaction: "Got it!" },
  slowly: { key: "slowly", word: "slowly", syllables: ["slow", "ly"], reaction: "Take your time." },
  follow: { key: "follow", word: "follow", syllables: ["fol", "low"], reaction: "Yes!" },
  deeper: { key: "deeper", word: "deeper", syllables: ["deep", "er"], reaction: "Good one!" },
  whispering: { key: "whispering", word: "whispering", syllables: ["whis", "per", "ing"], reaction: "So quiet!" },
  ancient: { key: "ancient", word: "ancient", syllables: ["an", "cient"], reaction: "Old and cool!" },
  crystal: { key: "crystal", word: "crystal", syllables: ["crys", "tal"], reaction: "Sparkle!" },
  shimmer: { key: "shimmer", word: "shimmer", syllables: ["shim", "mer"], reaction: "Twinkle twinkle!" },
  wonder: { key: "wonder", word: "wonder", syllables: ["won", "der"], reaction: "What a word!" },
  treasure: { key: "treasure", word: "treasure", syllables: ["trea", "sure"], reaction: "Ooh shiny!" },
  bubbles: { key: "bubbles", word: "bubbles", syllables: ["bub", "bles"], reaction: "Pop!" },
  swimming: { key: "swimming", word: "swimming", syllables: ["swim", "ming"], reaction: "Splash!" },
  dragon: { key: "dragon", word: "dragon", syllables: ["dra", "gon"], reaction: "Roar!" },
  meadow: { key: "meadow", word: "meadow", syllables: ["mea", "dow"], reaction: "Soft and green." },
  snowflake: { key: "snowflake", word: "snowflake", syllables: ["snow", "flake"], reaction: "Pretty!" },
  glitter: { key: "glitter", word: "glitter", syllables: ["glit", "ter"], reaction: "Sparkly!" },
  wobble: { key: "wobble", word: "wobble", syllables: ["wob", "ble"], reaction: "Wibbly!" },
  pebble: { key: "pebble", word: "pebble", syllables: ["peb", "ble"], reaction: "Tiny stone!" },
  ribbon: { key: "ribbon", word: "ribbon", syllables: ["rib", "bon"], reaction: "Pretty!" },
  bumpy: { key: "bumpy", word: "bumpy", syllables: ["bump", "y"], reaction: "Bouncy!" },
};

function pickWords(text: string): TappableWord[] {
  const used = new Set<string>();
  const result: TappableWord[] = [];
  for (const tok of text.toLowerCase().split(/[^a-z]+/)) {
    if (used.has(tok)) continue;
    if (COMMON_WORDS[tok]) {
      result.push(COMMON_WORDS[tok]);
      used.add(tok);
    }
  }
  return result;
}

function chap(title: string, paragraphs: string[]): ChapterSeed {
  return {
    title,
    sceneImageUrl: FOREST_SCENE,
    paragraphs,
    tappableWords: pickWords(paragraphs.join(" ")),
  };
}

// 5-chapter helper that produces a gentle arc (set out, encounter, problem,
// quiet middle, resolution) using the same friendly vocabulary.
function fiveChapterStory(
  slug: string,
  title: string,
  summary: string,
  beats: { titles: [string, string, string, string, string]; lines: [string, string, string, string, string] },
): StorySeed {
  return {
    slug,
    title,
    summary,
    chapters: [
      chap(beats.titles[0], [
        beats.lines[0],
        "You step carefully into the scene. Everything is glowing softly, slowly waking up around you.",
      ]),
      chap(beats.titles[1], [
        beats.lines[1],
        "A friendly voice whispers behind you. You follow the sound — quietly, deeper into the wonder.",
      ]),
      chap(beats.titles[2], [
        beats.lines[2],
        "Something shimmers in the distance. The path bends slowly and you follow, carefully.",
      ]),
      chap(beats.titles[3], [
        beats.lines[3],
        "You sit a moment. The trees behind you are humming. The whispering feels like an old friend.",
      ]),
      chap(beats.titles[4], [
        beats.lines[4],
        "You did it. The wonder hums one last time, slowly, and the stardust drifts behind you as you head home.",
      ]),
    ],
  };
}

const WORLDS: WorldSeed[] = [
  {
    slug: "whispering-woods",
    name: "Whispering Woods",
    blurb: "Help a lost voxel-bear find its way home through the blocky trees.",
    difficulty: 1,
    difficultyLabel: "Gentle Path",
    thumbnailUrl: "/images/reading-quest/world-forest.png",
    accentColor: "#A5FFD6",
    chipColor: "#A5FFD6",
    chipTextColor: "#0F766E",
    stories: [
      fiveChapterStory("the-glowing-clearing", "The Glowing Clearing", "A friendly fox shows up. Where will it lead?", {
        titles: ["Into the woods", "Following the fox", "Across the brook", "A quiet moss patch", "The bear's home"],
        lines: [
          "You step carefully into the glowing clearing. The trees here don't have leaves — they have soft, floating blocks of light that hum quietly.",
          "A small fox with a tail made of stardust pokes its head out from behind a glowing stump. It blinks its big eyes at you, then slowly waves a paw.",
          "A tiny brook chatters across mossy pebbles. The fox hops over, glancing back to make sure you're following deeper into the wonder.",
          "Behind a quietly humming bush, the moss is soft. You sit a moment. The whispering trees are not hurrying you.",
          "Behind a quietly humming bush, you find a cozy little den. A round voxel-bear is curled up inside, blinking sleepy eyes.",
        ],
      }),
      fiveChapterStory("the-friendly-fog", "The Friendly Fog", "A soft fog rolls in. It might want to be friends.", {
        titles: ["Soft fog", "Whispers in the mist", "Lantern light", "Resting in glow", "The fog goes home"],
        lines: [
          "A pale, friendly fog drifts slowly through the trees. It hums a tune you almost know.",
          "Inside the fog you hear whispering — quiet voices carefully telling stories from long ago.",
          "A small lantern floats out of the fog. It bobs gently, lighting the path just for you.",
          "You sit on a glowing pebble. The fog wraps around your shoulders like a blanket. You feel cozy.",
          "The fog drifts upward and disappears with a happy hum. You wave goodbye to the wonder.",
        ],
      }),
      fiveChapterStory("the-wobble-bridge", "The Wobble Bridge", "A bridge made of pebbles wobbles when you walk.", {
        titles: ["The bumpy path", "Pebble step one", "Pebble step two", "Almost across", "On the other side"],
        lines: [
          "The path is bumpy and the pebbles wobble carefully under your boots.",
          "You step on the first glowing pebble. It hums and slowly stops wobbling.",
          "Two more pebbles light up behind you. The whispering trees seem proud.",
          "Almost across! The last pebble shimmers, deeper than the others, glowing like a star.",
          "You hop down onto soft moss. A friendly bunny waves a paw and follows you home.",
        ],
      }),
    ],
  },
  {
    slug: "cloud-ruins",
    name: "Cloud Ruins",
    blurb: "Discover the secrets of the ancient floating temples in the sky.",
    difficulty: 2,
    difficultyLabel: "Breezy Climb",
    thumbnailUrl: "/images/reading-quest/world-sky.png",
    accentColor: "#84DCC6",
    chipColor: "#84DCC6",
    chipTextColor: "#1E40AF",
    stories: [
      fiveChapterStory("above-the-clouds", "Above the Clouds", "Float upward and see what the sky is hiding.", {
        titles: ["The cloud bridge", "Sky garden", "Sleepy steps", "Star window", "The quiet temple"],
        lines: [
          "You step onto a soft, floating bridge of clouds. Each block hums quietly under your feet.",
          "The garden floats slowly between clouds. Glowing flowers carefully open their petals when you walk by.",
          "Old stone steps lead up. You climb slowly. A friendly sky-fox watches from behind a pillar.",
          "Through a star window you see the whole world below. It is quietly glowing in the morning sun.",
          "The temple is older than any forest. Its stones are humming, glowing, and whispering at the same time.",
        ],
      }),
      fiveChapterStory("the-sleepy-temple", "The Sleepy Temple", "Wake the temple gently, the way it likes.", {
        titles: ["Quiet steps", "Owl's gift", "The slow door", "Bell of welcome", "Goodnight, temple"],
        lines: [
          "You walk quietly into the temple. Dust floats slowly through bars of warm light.",
          "Behind a curtain you find a sleepy stone owl with glowing eyes. It carefully drops a small star into your hand.",
          "A heavy door opens slowly. It is glad to see you and doesn't want to hurry.",
          "Inside, a soft bell rings on its own. The sound is gentle and round, whispering wonder through the room.",
          "You bow to the temple. It hums a goodnight, slowly. The stardust follows you out.",
        ],
      }),
      fiveChapterStory("kite-in-the-clouds", "Kite in the Clouds", "A friendly kite is stuck. Let's bring it home.", {
        titles: ["The lonely kite", "Up the cloud stairs", "Untangle gently", "A windy thank-you", "Down to the meadow"],
        lines: [
          "A glowing kite is tangled in a cloud. It wobbles and sighs softly.",
          "You climb the cloud stairs carefully. Each one hums a little tune as you step.",
          "You untangle the ribbon slowly. The kite shimmers and floats, free and happy.",
          "The wind says thank you with a quiet whoosh. The kite spins, glowing.",
          "Together you drift down to a soft meadow. The kite curls up beside you like a sleepy pet.",
        ],
      }),
    ],
  },
  {
    slug: "crystal-caverns",
    name: "Crystal Caverns",
    blurb: "Brave the deep caves to find the legendary glowing geodes.",
    difficulty: 3,
    difficultyLabel: "Brave Journey",
    thumbnailUrl: "/images/reading-quest/world-cave.png",
    accentColor: "#B4A0E5",
    chipColor: "#E5D4FF",
    chipTextColor: "#6B21A8",
    stories: [
      fiveChapterStory("deep-down", "Deep Down", "Climb down, slowly. The cave likes you.", {
        titles: ["Cave mouth", "Crystal bridge", "Glow river", "Quiet bend", "The big geode"],
        lines: [
          "The cave is deeper than you expected. Crystal walls shimmer softly, glowing in pinks and blues.",
          "A bridge made of crystal hums quietly under your feet. Below, glowing fish float in a black river.",
          "The river slows. You sit on a pebble and watch the glow drift past, carefully.",
          "The path bends. A quiet bat waits and waves a wing — it's glad you came this far.",
          "At the bottom of the cave is a giant glowing geode, full of wonder. Inside is a tiny stardust feather.",
        ],
      }),
      fiveChapterStory("the-singing-stones", "The Singing Stones", "The stones are humming a quiet song. Learn it.", {
        titles: ["First note", "Two more notes", "A wrong note (it's okay)", "The whole song", "Echo home"],
        lines: [
          "A row of crystal stones hums quietly. When you tap one, it glows and sings a single note.",
          "You tap two more stones. They glow brighter and join the song carefully.",
          "You tap a stone too soon. It wobbles. The cave gently hums and waits — it's okay to try again.",
          "When you tap them in order, the cave fills with shimmering light. The whole cave is glowing.",
          "The song echoes through the tunnels behind you, quietly walking you home.",
        ],
      }),
      fiveChapterStory("the-bat-and-the-pebble", "The Bat and the Pebble", "A bat finds something tiny and shiny.", {
        titles: ["Tiny squeak", "A glowing pebble", "Find the owner", "Through the dark", "A happy trade"],
        lines: [
          "A small bat squeaks quietly. It is holding a glowing pebble, carefully, in its little paw.",
          "The pebble shimmers. It is humming softly, like it wants to go home.",
          "You and the bat slowly follow the hum, deeper into the cave.",
          "The dark feels cozy when the pebble is glowing. The whispering walls help you find the way.",
          "You find a sleepy crystal turtle. The pebble was his. He gives the bat a tiny stardust hat as a thank-you.",
        ],
      }),
    ],
  },
  {
    slug: "tide-pools",
    name: "Tide Pools",
    blurb: "Splash through warm pools where bubbles know your name.",
    difficulty: 1,
    difficultyLabel: "Gentle Path",
    thumbnailUrl: "/images/reading-quest/world-forest.png",
    accentColor: "#7DD3FC",
    chipColor: "#BAE6FD",
    chipTextColor: "#075985",
    stories: [
      fiveChapterStory("the-bubble-trail", "The Bubble Trail", "Bubbles pop when you say hello.", {
        titles: ["Soft splashes", "First bubble", "A swimming friend", "Quiet pool", "Home with the tide"],
        lines: [
          "Warm water hums quietly around your toes. Tiny bubbles rise slowly to say hello.",
          "You wave at a bubble. It pops with a tiny shimmer of stardust.",
          "A small turtle is swimming carefully behind a glowing rock. It blinks and follows you deeper.",
          "You sit by a quiet pool. The bubbles whisper and the turtle hums beside you.",
          "The tide gently brings you home. The turtle waves goodbye with a slow flipper.",
        ],
      }),
      fiveChapterStory("the-shy-octopus", "The Shy Octopus", "An octopus is hiding. Let's coax it out, slowly.", {
        titles: ["A shy shadow", "Glowing pebble", "Tiny wave", "Eight quiet hands", "A gentle goodnight"],
        lines: [
          "A shy octopus is hiding behind a crystal rock. It only peeks out slowly.",
          "You roll a glowing pebble across the sand. The octopus shimmers carefully, watching.",
          "You wave with one finger. The octopus waves back with one quiet arm.",
          "Eight small hands reach out, slowly. They feel like soft ribbons against your palm.",
          "You hum the temple song. The octopus glows pink, then blue, then drifts off to sleep.",
        ],
      }),
      fiveChapterStory("the-glowing-fish-school", "The Glowing Fish School", "A whole school of fish is glowing tonight.", {
        titles: ["First glow", "Many glows", "A swirling cloud", "A tiny wonder", "Goodnight, school"],
        lines: [
          "A single fish lights up the pool. It hums a quiet tune.",
          "Behind it come many more, glowing softly in pinks and greens.",
          "The fish swirl carefully around you, whispering with their tails.",
          "In the middle of the swirl, a tiny shimmer floats — the smallest fish of all, glowing the brightest.",
          "The school slowly drifts away to sleep. The water is quiet and full of wonder.",
        ],
      }),
    ],
  },
  {
    slug: "starlit-meadow",
    name: "Starlit Meadow",
    blurb: "A wide soft meadow where the grass remembers every kind word.",
    difficulty: 2,
    difficultyLabel: "Breezy Climb",
    thumbnailUrl: "/images/reading-quest/world-sky.png",
    accentColor: "#FCD34D",
    chipColor: "#FEF3C7",
    chipTextColor: "#92400E",
    stories: [
      fiveChapterStory("a-quiet-picnic", "A Quiet Picnic", "Tiny pet, big picnic, soft blanket.", {
        titles: ["Soft blanket", "First snack", "A gentle visitor", "Cloud watching", "Folding up slowly"],
        lines: [
          "You spread a soft blanket on the meadow. The grass hums quietly under your hands.",
          "You take out a star cookie. A glowing crumb floats up like a tiny firefly.",
          "A small bunny hops over, quietly, and sits with you. It nibbles a crumb carefully.",
          "You both lie back and watch the clouds drift slowly, whispering shapes you almost know.",
          "You fold the blanket up at sunset. The bunny follows you home, hopping behind in a glow of stardust.",
        ],
      }),
      fiveChapterStory("firefly-night", "Firefly Night", "Hundreds of tiny lights wake up at the same time.", {
        titles: ["First spark", "A whole choir", "Dancing slowly", "A quiet wish", "The lights go home"],
        lines: [
          "One firefly glows over the meadow. It hums a tiny note.",
          "Soon there are many — a whole choir of glowing dots, whispering across the sky.",
          "They dance slowly, drawing soft shapes in the dark, behind every quiet tree.",
          "You make a wish, very carefully. A firefly lands on your finger and shimmers.",
          "One by one, the lights drift home. The meadow keeps glowing for a long, gentle minute.",
        ],
      }),
      fiveChapterStory("a-snail-named-pebble", "A Snail Named Pebble", "Slow is just right. Pebble knows.", {
        titles: ["A bumpy trail", "Hello, Pebble", "A slow walk", "Carefully across", "Home in the moss"],
        lines: [
          "A bumpy little trail winds through the meadow. A wobbly snail is leaving stardust behind.",
          "You whisper hello. The snail glows pink and slowly waves a tiny eye.",
          "You walk together. Each step is slow, quiet, and full of wonder.",
          "Carefully, the snail crosses a glowing pebble bridge. You hold your breath. It hums.",
          "Pebble curls up in a soft moss bed. You wave goodnight and the meadow whispers back.",
        ],
      }),
    ],
  },
  {
    slug: "dragon-snowfields",
    name: "Dragon Snowfields",
    blurb: "Quiet snow, gentle dragons, and cozy mittens.",
    difficulty: 3,
    difficultyLabel: "Brave Journey",
    thumbnailUrl: "/images/reading-quest/world-cave.png",
    accentColor: "#E0E7FF",
    chipColor: "#E0E7FF",
    chipTextColor: "#3730A3",
    stories: [
      fiveChapterStory("first-snowflake", "First Snowflake", "One snowflake, then a whole quiet sky.", {
        titles: ["A single snowflake", "Mittens on", "Quiet trail", "Bumpy hill", "Cozy by the fire"],
        lines: [
          "One soft snowflake lands on your nose. It glitters quietly, glowing pink in the dawn.",
          "You pull on mittens carefully. The snow whispers as you take your first slow step.",
          "The trail is hushed. Behind every tree, snowflakes float slowly, like wonder taking its time.",
          "A bumpy little hill calls. You climb slowly, leaving glowing footprints behind you.",
          "Inside a cozy hut, a small fire hums. You sip warm cocoa and listen to the snow.",
        ],
      }),
      fiveChapterStory("the-tiny-dragon", "The Tiny Dragon", "Even big dragons start very small.", {
        titles: ["A whisper of smoke", "An egg!", "A first sneeze", "Soft wings", "First flight"],
        lines: [
          "A tiny puff of smoke drifts out of a snowdrift. You step carefully closer.",
          "Inside a glowing nest is a small egg, humming a quiet song. It shimmers in your hands.",
          "The egg sneezes. A tiny dragon pops out, blinking slowly, glowing pink.",
          "You fold a soft mitten around the dragon. Its little wings hum, drying in the warm light.",
          "The dragon hops, then floats, then flies — slowly, carefully — leaving stardust behind in the snow.",
        ],
      }),
      fiveChapterStory("the-quiet-aurora", "The Quiet Aurora", "Northern lights without the cold.", {
        titles: ["Pale glow", "A bigger glow", "Colors humming", "A wish whispered", "The lights tuck in"],
        lines: [
          "A pale glow rises over the snow, slowly. It hums quietly, like the aurora is waking up.",
          "Soon a bigger glow joins. Pinks and greens and blues drift carefully across the sky.",
          "The colors hum together. Each one whispers a different note, glowing in turn.",
          "You whisper a tiny wish. The aurora sparkles, as if it heard you carefully.",
          "The lights slowly tuck themselves behind the mountains. You walk home, glowing inside.",
        ],
      }),
    ],
  },
];

const SHOP_ITEMS = [
  { id: "snack.berry", kind: "snack", name: "Glow Berry", description: "A small but cheerful snack.", gemPrice: 1, fullnessBoost: 10, happinessBoost: 5, requiresPetLevel: 0, emoji: "🍓", glowColor: null, sortIndex: 0 },
  { id: "snack.cookie", kind: "snack", name: "Star Cookie", description: "Crunchy and sparkly.", gemPrice: 3, fullnessBoost: 25, happinessBoost: 15, requiresPetLevel: 0, emoji: "🍪", glowColor: null, sortIndex: 1 },
  { id: "snack.drumstick", kind: "snack", name: "Hearty Roast", description: "Big snack for hungry pets.", gemPrice: 5, fullnessBoost: 45, happinessBoost: 10, requiresPetLevel: 0, emoji: "🍗", glowColor: null, sortIndex: 2 },
  { id: "snack.cake", kind: "snack", name: "Birthday Cake", description: "A surprise treat!", gemPrice: 8, fullnessBoost: 30, happinessBoost: 40, requiresPetLevel: 0, emoji: "🎂", glowColor: null, sortIndex: 3 },
  { id: "hat.crown", kind: "hat", name: "Tiny Crown", description: "Royal vibes.", gemPrice: 6, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 0, emoji: "👑", glowColor: null, sortIndex: 10 },
  { id: "hat.wizard", kind: "hat", name: "Wizard Hat", description: "Sparkles included.", gemPrice: 10, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 2, emoji: "🧙", glowColor: null, sortIndex: 11 },
  { id: "hat.party", kind: "hat", name: "Party Hat", description: "Always a good time.", gemPrice: 4, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 0, emoji: "🎉", glowColor: null, sortIndex: 12 },
  { id: "hat.halo", kind: "hat", name: "Glow Halo", description: "Soft and shiny.", gemPrice: 15, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 4, emoji: "😇", glowColor: null, sortIndex: 13 },
  { id: "glow.berry", kind: "glow", name: "Berry Pop", description: "A purple glow.", gemPrice: 5, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 0, emoji: "🟣", glowColor: "berry", sortIndex: 20 },
  { id: "glow.sun", kind: "glow", name: "Sunset", description: "Warm orange glow.", gemPrice: 5, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 0, emoji: "🟠", glowColor: "sun", sortIndex: 21 },
  { id: "glow.sky", kind: "glow", name: "Sky Drift", description: "Cool blue glow.", gemPrice: 5, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 0, emoji: "🔵", glowColor: "sky", sortIndex: 22 },
  { id: "glow.rainbow", kind: "glow", name: "Rainbow", description: "All the colors.", gemPrice: 20, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 5, emoji: "🌈", glowColor: "rainbow", sortIndex: 23 },
  { id: "decor.rug", kind: "decor", name: "Cozy Rug", description: "Soft on the paws.", gemPrice: 4, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 0, emoji: "🟫", glowColor: null, sortIndex: 30 },
  { id: "decor.lamp", kind: "decor", name: "Lava Lamp", description: "Slow and dreamy.", gemPrice: 6, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 0, emoji: "🪔", glowColor: null, sortIndex: 31 },
  { id: "decor.plant", kind: "decor", name: "Glow Plant", description: "Always cheerful.", gemPrice: 3, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 0, emoji: "🪴", glowColor: null, sortIndex: 32 },
  { id: "decor.bookshelf", kind: "decor", name: "Tiny Library", description: "For your stories.", gemPrice: 8, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 2, emoji: "📚", glowColor: null, sortIndex: 33 },
  { id: "decor.bed", kind: "decor", name: "Cloud Bed", description: "Big sleepy energy.", gemPrice: 10, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 3, emoji: "☁️", glowColor: null, sortIndex: 34 },
  { id: "decor.window", kind: "decor", name: "Star Window", description: "Stars all night.", gemPrice: 12, fullnessBoost: 0, happinessBoost: 0, requiresPetLevel: 4, emoji: "🌌", glowColor: null, sortIndex: 35 },
];

const EXPECTED_WORLDS = WORLDS.length;

export async function seed() {
  // Idempotent in steady state, but auto-reseeds when the library has grown
  // (e.g. after a content update from 3 worlds to 6) so the dev DB picks up
  // the expansion without a manual reset.
  const existing = await db.select().from(worldsTable);
  if (existing.length >= EXPECTED_WORLDS) {
    return { seeded: false };
  }

  await db.execute(sql`TRUNCATE worlds, stories, chapters, finished_chapters, sessions, word_help_events, shop_items, owned_items, decor_state, transactions, child_profiles, preferences, unlocked_stories RESTART IDENTITY CASCADE`);

  await db.insert(childProfilesTable).values({ name: "Alex", gems: 24, stars: 12, petLevel: 3, petXp: 100, fullness: 70, happiness: 75 });

  let worldSort = 0;
  for (const w of WORLDS) {
    const insertedWorld = await db
      .insert(worldsTable)
      .values({
        slug: w.slug, name: w.name, blurb: w.blurb,
        difficulty: w.difficulty, difficultyLabel: w.difficultyLabel,
        thumbnailUrl: w.thumbnailUrl, accentColor: w.accentColor,
        chipColor: w.chipColor, chipTextColor: w.chipTextColor,
        sortIndex: worldSort++,
      })
      .returning();
    let storySort = 0;
    for (const s of w.stories) {
      // First story per world is free; subsequent stories cost gems to unlock
      // so kids feel real progression and can spend their earned gems.
      const gemUnlockCost = storySort === 0 ? 0 : storySort === 1 ? 5 : 10;
      const insertedStory = await db
        .insert(storiesTable)
        .values({
          worldId: insertedWorld[0]!.id,
          slug: s.slug,
          title: s.title,
          summary: s.summary,
          sortIndex: storySort++,
          gemUnlockCost,
        })
        .returning();
      let chapSort = 0;
      for (const c of s.chapters) {
        await db.insert(chaptersTable).values({
          storyId: insertedStory[0]!.id,
          sortIndex: chapSort++,
          title: c.title,
          sceneImageUrl: c.sceneImageUrl,
          paragraphs: c.paragraphs,
          tappableWords: c.tappableWords,
        });
      }
    }
  }

  for (const it of SHOP_ITEMS) {
    await db.insert(shopItemsTable).values(it);
  }

  const profile = await db.select().from(childProfilesTable).limit(1);
  const profileId = profile[0]!.id;
  for (const itemId of ["hat.crown", "decor.rug", "decor.plant"]) {
    await db.insert(ownedItemsTable).values({ profileId, itemId });
  }
  for (const itemId of ["decor.rug", "decor.plant"]) {
    await db.insert(decorStateTable).values({ profileId, itemId, enabled: true });
  }

  return { seeded: true };
}
