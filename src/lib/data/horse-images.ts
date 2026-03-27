/**
 * Central horse image mapping.
 * Maps horse names to their image files in /public/horses/.
 * Horses without unique photos get assigned an existing image.
 */

const HORSE_IMAGE_MAP: Record<string, string> = {
  // === Horses with unique photos ===
  "Incredibolt": "/horses/Incrediboltselfie.png",
  "Grittiness": "/horses/gritty.png",
  "Confessional": "/horses/Confessional.png",
  "Buetane": "/horses/Buetane.png",
  "Lockstocknpharoah": "/horses/LockStockPharaoh.png",
  "Ocelli": "/horses/Ocelli.png",
  "Clocker Special": "/horses/ClockerSpecial.png",
  "Work": "/horses/Work.png",
  "Epic Desire": "/horses/EpicDesire.png",
  "High Camp": "/horses/HighCamp.png",
  "Firestorm King": "/horses/FirestormKing.png",
  "Silk and Steel": "/horses/SilkandSteel.png",
  "Copper Bullet": "/horses/CopperBullethorse.png",
  "Dawn Patrol": "/horses/DawnPatrol.png",
  "Last Tycoon": "/horses/LastTycoon.png",
  "Moon Over Miami": "/horses/moonovermiami.png",
  "Steel Reserve": "/horses/SteelReserve.png",
  "Blazing Glory": "/horses/BlazingGlory.png",
  "Quiet Storm": "/horses/QuietStorm.png",
  "Regal Prince": "/horses/RegalPrince.png",
  // === New photos from horse images folder ===
  "Banishing": "/horses/banishing.png",
  "Blacksmith": "/horses/blacksmith.png",
  "British Isles": "/horses/britishisles.png",
  "Brotha Keny": "/horses/brothakeny.png",
  "Captain Cook": "/horses/captaincook.png",
  "Chip Honcho": "/horses/chiphoncho.png",
  "Disco Time": "/horses/discotime.png",
  "Easterly": "/horses/easterly.png",
  "Emerging Market": "/horses/emergingmarket.png",
  "Golden Tempo": "/horses/goldentempo.png",
  "Lightning Tones": "/horses/lightningtones.png",
  "Mika": "/horses/mika.png",
  "Pavlovian": "/horses/Pavlovian.png",
  "Poster": "/horses/poster.png",
  "Skippylongstocking": "/horses/Skippylongstocking.png",
  "Tappan Street": "/horses/tappanstreet.png",
  "Universe": "/horses/universal.png",
  "White Abarrio": "/horses/WhiteAbarrio.png",
  // === Horses without unique photos — reuse existing images ===
  "Almendares (GB)": "/horses/SteelReserve.png",
  "Astronomer": "/horses/DawnPatrol.png",
  "Autobahn": "/horses/FirestormKing.png",
  "Balboa": "/horses/gritty.png",
  "Beach Gold": "/horses/goldentempo.png",
  "Cabo Spirit": "/horses/CopperBullethorse.png",
  "Call Sign Seven": "/horses/LastTycoon.png",
  "Chasing the Crown": "/horses/BlazingGlory.png",
  "Crown the Buckeye": "/horses/RegalPrince.png",
  "Cugino": "/horses/captaincook.png",
  "Dirty Rich": "/horses/blacksmith.png",
  "Exhibition Only": "/horses/Buetane.png",
  "Fort Washington": "/horses/emergingmarket.png",
  "Fourth and One": "/horses/poster.png",
  "Full Serrano (ARG)": "/horses/Confessional.png",
  "Hammond": "/horses/mika.png",
  "Iron Honor": "/horses/WhiteAbarrio.png",
  "Major Dude": "/horses/Skippylongstocking.png",
  "One Stripe (SAF)": "/horses/banishing.png",
  "Program Trading (GB)": "/horses/britishisles.png",
  "Right to Party": "/horses/lightningtones.png",
  "Spirit of Royal": "/horses/EpicDesire.png",
  "Test Score": "/horses/tappanstreet.png",
};

/** Get horse image URL by name. Returns a fallback if not found. */
export function getHorseImageUrl(name: string): string {
  return HORSE_IMAGE_MAP[name] ?? "/horses/gritty.png";
}
