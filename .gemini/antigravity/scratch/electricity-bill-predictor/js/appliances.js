// Appliance Catalog — wattage data + icons
export const APPLIANCE_CATALOG = [
  { id: 'ac',           name: 'Air Conditioner', icon: '❄️', watts: 1500, defaultHours: 8,  defaultDays: 30 },
  { id: 'fridge',       name: 'Refrigerator',    icon: '🧊', watts: 150,  defaultHours: 24, defaultDays: 30 },
  { id: 'tv',           name: 'Television',       icon: '📺', watts: 100,  defaultHours: 5,  defaultDays: 30 },
  { id: 'washing',      name: 'Washing Machine',  icon: '🫧', watts: 500,  defaultHours: 1,  defaultDays: 20 },
  { id: 'geyser',       name: 'Geyser/Heater',   icon: '🚿', watts: 2000, defaultHours: 1,  defaultDays: 30 },
  { id: 'microwave',    name: 'Microwave',        icon: '📡', watts: 1200, defaultHours: 0.5,defaultDays: 30 },
  { id: 'fan',          name: 'Ceiling Fan',      icon: '🌀', watts: 75,   defaultHours: 12, defaultDays: 30 },
  { id: 'led',          name: 'LED Bulb',         icon: '💡', watts: 10,   defaultHours: 8,  defaultDays: 30 },
  { id: 'laptop',       name: 'Laptop',           icon: '💻', watts: 65,   defaultHours: 8,  defaultDays: 30 },
  { id: 'desktop',      name: 'Desktop PC',       icon: '🖥️', watts: 300,  defaultHours: 6,  defaultDays: 30 },
  { id: 'iron',         name: 'Clothes Iron',     icon: '👔', watts: 1000, defaultHours: 0.5,defaultDays: 20 },
  { id: 'mixer',        name: 'Mixer/Grinder',    icon: '🥤', watts: 750,  defaultHours: 0.3,defaultDays: 30 },
  { id: 'pump',         name: 'Water Pump',       icon: '💧', watts: 750,  defaultHours: 1,  defaultDays: 30 },
  { id: 'dishwasher',   name: 'Dishwasher',       icon: '🍽️', watts: 1200, defaultHours: 1,  defaultDays: 20 },
  { id: 'heater',       name: 'Room Heater',      icon: '🔥', watts: 1500, defaultHours: 4,  defaultDays: 15 },
  { id: 'charger',      name: 'Phone Charger',    icon: '🔌', watts: 10,   defaultHours: 3,  defaultDays: 30 },
];

// Compute base kWh for one appliance entry
export function computeBaseUnits(watts, hours, days, qty = 1) {
  return (watts * hours * days * qty) / 1000;
}

// Generate tips based on high-usage appliances
export function generateTips(selectedAppliances) {
  const tips = [];
  const hasAC = selectedAppliances.some(a => a.id === 'ac');
  const hasGeyser = selectedAppliances.some(a => a.id === 'geyser');
  const hasFridge = selectedAppliances.some(a => a.id === 'fridge');
  const totalUnits = selectedAppliances.reduce((s, a) => s + computeBaseUnits(a.watts, a.hours, a.days, a.qty), 0);

  if (hasAC) tips.push({ icon: '❄️', text: 'Set AC to 24°C — each degree lower increases consumption by ~6%.' });
  if (hasGeyser) tips.push({ icon: '🚿', text: 'Use a solar water heater to cut geyser energy by up to 80%.' });
  if (hasFridge) tips.push({ icon: '🧊', text: 'Keep your fridge 2/3 full and away from walls for best efficiency.' });
  if (totalUnits > 300) tips.push({ icon: '⚡', text: 'Consider switching to energy-efficient inverter appliances to save 30–40%.' });
  tips.push({ icon: '💡', text: 'Replace remaining incandescent bulbs with LED to save up to 80% on lighting.' });
  tips.push({ icon: '🔌', text: 'Unplug chargers and devices on standby — phantom loads add 5–10% to your bill.' });
  tips.push({ icon: '⏰', text: 'Use heavy appliances (washing machine, iron) during off-peak hours (10pm–6am).' });

  return tips.slice(0, 5);
}
