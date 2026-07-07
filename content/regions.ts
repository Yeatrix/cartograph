// ─── Seed content ────────────────────────────────────────────────────────────
// One launch region: Meditations by Marcus Aurelius, George Long translation
// (1862, public domain). Excerpts are lightly abridged. Replace or extend
// freely — curation is the product's IP. Each excerpt maps to one map zone.
import { Region } from "@/lib/types";

export const REGIONS: Region[] = [
  {
    slug: "meditations",
    title: "Meditations",
    author: "Marcus Aurelius",
    difficulty: "highlands",
    difficultyMultiplier: 1.6,
    description:
      "The private notebook of a Roman emperor \u2014 written to himself, never meant for readers. Six ascents from the shore of his mind to its summit.",
    excerpts: [
      {
        position: 1,
        title: "The People You Will Meet",
        source: "Book II \u00b71 \u00b7 George Long translation (abridged)",
        mapZoneId: "z1",
        zoneName: "The Landing",
        themes: ["anger", "other people", "expectation"],
        content:
          "Begin the morning by saying to thyself, I shall meet with the busy-body, the ungrateful, arrogant, deceitful, envious, unsocial. All these things happen to them by reason of their ignorance of what is good and evil.\n\nBut I who have seen the nature of the good that it is beautiful, and of the bad that it is ugly, and the nature of him who does wrong, that it is akin to me \u2014 not only of the same blood or seed, but that it participates in the same intelligence \u2014 I can neither be injured by any of them, for no one can fix on me what is ugly, nor can I be angry with my kinsman, nor hate him.\n\nFor we are made for co-operation, like feet, like hands, like eyelids, like the rows of the upper and lower teeth. To act against one another then is contrary to nature; and it is acting against one another to be vexed and to turn away."
      },
      {
        position: 2,
        title: "What You Actually Own",
        source: "Book II \u00b714 \u00b7 George Long translation (abridged)",
        mapZoneId: "z2",
        zoneName: "The Present Hour",
        themes: ["time", "mortality", "attention"],
        content:
          "Though thou shouldst be going to live three thousand years, and as many times ten thousand years, still remember that no man loses any other life than this which he now lives, nor lives any other than this which he now loses. The longest and shortest are thus brought to the same.\n\nFor the present is the same to all, and that which perishes is not the same; and so that which is lost appears to be a mere moment. For a man cannot lose either the past or the future: for what a man has not, how can any one take this from him?\n\nBear in mind that every man lives only this present time, which is an indivisible point, and that all the rest of his life is either past or it is uncertain."
      },
      {
        position: 3,
        title: "The Citadel Within",
        source: "Book IV \u00b73 \u00b7 George Long translation (abridged)",
        mapZoneId: "z3",
        zoneName: "The Inner Keep",
        themes: ["solitude", "restlessness", "peace"],
        content:
          "Men seek retreats for themselves, houses in the country, sea-shores, and mountains; and thou too art wont to desire such things very much. But this is altogether a mark of the most common sort of men, for it is in thy power whenever thou shalt choose to retire into thyself.\n\nFor nowhere either with more quiet or more freedom from trouble does a man retire than into his own soul, particularly when he has within him such thoughts that by looking into them he is immediately in perfect tranquillity.\n\nConstantly then give to thyself this retreat, and renew thyself; and let thy principles be brief and fundamental, which, as soon as thou shalt recur to them, will be sufficient to cleanse the soul completely, and to send thee back free from all discontent."
      },
      {
        position: 4,
        title: "On Rising From Bed",
        source: "Book V \u00b71 \u00b7 George Long translation (abridged)",
        mapZoneId: "z4",
        zoneName: "First Light Camp",
        themes: ["discipline", "purpose", "comfort"],
        content:
          "In the morning when thou risest unwillingly, let this thought be present \u2014 I am rising to the work of a human being. Why then am I dissatisfied if I am going to do the things for which I exist and for which I was brought into the world?\n\nOr have I been made for this, to lie in the bed-clothes and keep myself warm? \u2014 But this is more pleasant. \u2014 Dost thou exist then to take thy pleasure, and not at all for action or exertion?\n\nDost thou not see the little plants, the little birds, the ants, the spiders, the bees working together to put in order their several parts of the universe? And art thou unwilling to do the work of a human being, and dost thou not make haste to do that which is according to thy nature?"
      },
      {
        position: 5,
        title: "The Obstacle on the Road",
        source: "Book V \u00b720 \u00b7 George Long translation (abridged)",
        mapZoneId: "z5",
        zoneName: "The Blocked Pass",
        themes: ["obstacles", "adversity", "adaptation"],
        content:
          "In one respect man is the nearest thing to me, so far as I must do good to men and endure them. But so far as some men make themselves obstacles to my proper acts, man becomes to me one of the things which are indifferent, no less than the sun or wind or a wild beast.\n\nNow it is true that these may impede my action, but they are no impediments to my affects and disposition, which have the power of acting conditionally and changing: for the mind converts and changes every hindrance to its activity into an aid; and so that which is an impediment to this work becomes an advancement, and that which is an obstacle on the road helps us on this road."
      },
      {
        position: 6,
        title: "While You Live",
        source: "Book IV \u00b717 & Book VII \u00b759 \u00b7 George Long translation (abridged)",
        mapZoneId: "z6",
        zoneName: "The Summit",
        themes: ["mortality", "goodness", "urgency"],
        content:
          "Not to live as if thou hadst ten thousand years. Death hangs over thee. While thou livest, while it is in thy power, be good.\n\nLook within. Within is the fountain of good, and it will ever bubble up, if thou wilt ever dig.\n\nNo longer talk at all about the kind of man that a good man ought to be, but be such."
      }
    ]
  }
];

export function getRegion(slug: string): Region | null {
  return REGIONS.find((r) => r.slug === slug) ?? null;
}
