/**
 * Intelligent AI & NLP Service for Smart Campus
 * Provides category suggestions, duplicate detection, priority scoring, and campus hotspots
 */

const CATEGORY_KEYWORDS = {
  'Electrical': [
    'light', 'bulb', 'switch', 'socket', 'plug', 'wire', 'wiring', 'spark', 'sparking',
    'power', 'fuse', 'short circuit', 'mcb', 'blackout', 'voltage', 'shock', 'tubelight', 'led'
  ],
  'Plumbing & Water': [
    'tap', 'water', 'pipe', 'leak', 'leaking', 'drain', 'drainage', 'basin', 'sink', 'toilet',
    'flush', 'sewage', 'clog', 'clogged', 'tank', 'overflow', 'drinking water', 'cooler', 'faucet', 'restroom'
  ],
  'Furniture & Benches': [
    'bench', 'desk', 'chair', 'table', 'podium', 'board', 'blackboard', 'whiteboard', 'door',
    'window', 'hinge', 'handle', 'cupboard', 'drawer', 'furniture', 'seat', 'cushion', 'wood'
  ],
  'Wi-Fi & Network': [
    'wifi', 'wi-fi', 'internet', 'network', 'router', 'ethernet', 'lan', 'connection', 'slow speed',
    'portal', 'signal', 'access point', 'connectivity', 'dns', 'ip', 'offline', 'firewall'
  ],
  'HVAC & Fans': [
    'fan', 'ceiling fan', 'ac', 'air conditioner', 'cooling', 'heating', 'blower', 'remote',
    'thermostat', 'exhaust', 'ventilation', 'regulator', 'temperature'
  ],
  'Classroom Maintenance': [
    'projector', 'screen', 'audio', 'speaker', 'mic', 'microphone', 'curtain', 'podium',
    'hdmi', 'cable', 'marker', 'duster', 'chalk', 'display', 'smartboard', 'vga'
  ],
  'Cleanliness & Sanitation': [
    'garbage', 'dustbin', 'trash', 'dirty', 'smell', 'odor', 'stain', 'cleaning', 'sweeping',
    'litter', 'spider', 'cobweb', 'dust', 'hygiene', 'washroom', 'debris'
  ],
};

const EMERGENCY_WORDS = ['fire', 'smoke', 'sparking', 'electric shock', 'exposed wire', 'flood', 'flooding', 'burst pipe', 'hazard', 'gas', 'danger', 'explosion', 'ceiling collapse', 'injur'];
const HIGH_WORDS = ['blackout', 'no water', 'major leak', 'broken glass', 'server down', 'exam hall', 'auditorium', 'power cut', 'urgent', 'overflowing', 'stuck', 'lock broken'];
const LOW_WORDS = ['minor', 'scratch', 'loose handle', 'creak', 'paint', 'faded', 'curtain', 'dusty', 'cosmetic', 'squeak'];

export function suggestCategory(title = '', description = '') {
  const combinedText = `${title} ${description}`.toLowerCase();
  const words = combinedText.split(/\W+/).filter(Boolean);

  let bestCategory = 'Other';
  let highestScore = 0;
  const matchDetails = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    const matches = [];

    for (const kw of keywords) {
      if (kw.includes(' ')) {
        if (combinedText.includes(kw)) {
          score += 3;
          matches.push(kw);
        }
      } else {
        const count = words.filter(w => w === kw).length;
        if (count > 0) {
          score += count * 2;
          matches.push(kw);
        }
      }
    }

    matchDetails[category] = { score, matches };
    if (score > highestScore) {
      highestScore = score;
      bestCategory = category;
    }
  }

  const confidence = highestScore > 5 ? 0.95 : highestScore > 2 ? 0.75 : highestScore > 0 ? 0.5 : 0.2;

  return {
    category: bestCategory,
    confidence,
    reason: highestScore > 0 
      ? `Detected campus keywords: ${matchDetails[bestCategory]?.matches.slice(0, 3).join(', ')}`
      : 'General maintenance issue',
    allScores: matchDetails,
  };
}

export function suggestPriority(title = '', description = '', category = 'Other') {
  const combinedText = `${title} ${description}`.toLowerCase();

  for (const w of EMERGENCY_WORDS) {
    if (combinedText.includes(w)) {
      return {
        priority: 'Emergency',
        confidence: 0.98,
        reason: `Critical campus safety keyword detected: "${w}". Requires immediate intervention within 1-2 hours.`,
      };
    }
  }

  for (const w of HIGH_WORDS) {
    if (combinedText.includes(w)) {
      return {
        priority: 'High',
        confidence: 0.88,
        reason: `High impact campus issue keyword detected: "${w}".`,
      };
    }
  }

  if (category === 'Electrical' && (combinedText.includes('wire') || combinedText.includes('spark') || combinedText.includes('switch'))) {
    return {
      priority: 'High',
      confidence: 0.85,
      reason: 'Electrical fixtures can pose electrocution or fire hazards if left unattended.',
    };
  }

  for (const w of LOW_WORDS) {
    if (combinedText.includes(w)) {
      return {
        priority: 'Low',
        confidence: 0.82,
        reason: `Non-critical campus maintenance keyword detected: "${w}".`,
      };
    }
  }

  return {
    priority: 'Medium',
    confidence: 0.7,
    reason: 'Standard campus maintenance priority.',
  };
}

function calculateTextSimilarity(text1, text2) {
  const words1 = new Set(text1.toLowerCase().split(/\W+/).filter(w => w.length > 2));
  const words2 = new Set(text2.toLowerCase().split(/\W+/).filter(w => w.length > 2));

  if (words1.size === 0 || words2.size === 0) return 0;

  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }

  const union = new Set([...words1, ...words2]).size;
  return intersection / union;
}

export function checkDuplicates(newComplaint, existingComplaints = []) {
  const { title = '', description = '', category = '', location = {} } = newComplaint;
  const newLocStr = `${location.building || ''} ${location.room || ''}`.trim().toLowerCase();
  const newCombined = `${title} ${description}`;

  const candidates = [];

  for (const item of existingComplaints) {
    // Only check against open or in-progress complaints
    if (item.status === 'Resolved' || item.status === 'Rejected') continue;

    const itemLocStr = `${item.location?.building || ''} ${item.location?.room || ''}`.trim().toLowerCase();
    const isSameLocation = newLocStr && itemLocStr && (newLocStr === itemLocStr);
    const isSameCategory = category && item.category === category;

    const textSim = calculateTextSimilarity(newCombined, `${item.title} ${item.description}`);

    let totalScore = 0;
    if (isSameLocation) totalScore += 0.45;
    if (isSameCategory) totalScore += 0.25;
    totalScore += textSim * 0.3;

    if (totalScore >= 0.4 || (isSameLocation && (isSameCategory || textSim > 0.2))) {
      candidates.push({
        complaintId: item.complaintId || item._id,
        id: item._id,
        title: item.title,
        status: item.status,
        category: item.category,
        location: item.location,
        createdAt: item.createdAt,
        similarityScore: Math.min(1, Math.round(totalScore * 100)),
        upvotesCount: item.upvotes?.length || 0,
      });
    }
  }

  candidates.sort((a, b) => b.similarityScore - a.similarityScore);

  return {
    isDuplicate: candidates.length > 0,
    matches: candidates.slice(0, 3),
    warningMessage: candidates.length > 0
      ? `A similar active complaint (#${candidates[0].complaintId}: "${candidates[0].title}") was already reported in ${candidates[0].location?.building || 'this area'}. You can upvote it to prioritize attention!`
      : null,
  };
}

export function analyzeHotspots(complaints = []) {
  const buildingMap = {};

  for (const c of complaints) {
    const building = c.location?.building || 'Unknown';
    const room = c.location?.room || 'General';
    const key = `${building} - ${room}`;

    if (!buildingMap[key]) {
      buildingMap[key] = {
        key,
        building,
        room,
        floor: c.location?.floor || '1st Floor',
        total: 0,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        highOrEmergency: 0,
        categories: {},
        latestComplaintDate: c.createdAt,
      };
    }

    const entry = buildingMap[key];
    entry.total++;
    if (c.status === 'Pending') entry.pending++;
    if (c.status === 'In Progress' || c.status === 'Assigned') entry.inProgress++;
    if (c.status === 'Resolved') entry.resolved++;
    if (c.priority === 'High' || c.priority === 'Emergency') entry.highOrEmergency++;

    entry.categories[c.category] = (entry.categories[c.category] || 0) + 1;
    if (new Date(c.createdAt) > new Date(entry.latestComplaintDate)) {
      entry.latestComplaintDate = c.createdAt;
    }
  }

  // Calculate severity index for hotspot ranking
  const hotspotList = Object.values(buildingMap).map(h => {
    // Score based on active issues, total volume, and emergency factor
    const score = (h.pending * 2.5) + (h.inProgress * 1.5) + (h.highOrEmergency * 3) + (h.total * 0.5);
    let riskLevel = 'Low';
    if (score >= 12 || h.highOrEmergency >= 2) riskLevel = 'Critical';
    else if (score >= 6) riskLevel = 'Moderate';

    // Primary issue category
    const topCategory = Object.entries(h.categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'General';

    return {
      ...h,
      severityScore: Math.round(score * 10) / 10,
      riskLevel,
      topCategory,
    };
  });

  hotspotList.sort((a, b) => b.severityScore - a.severityScore);

  return {
    hotspots: hotspotList,
    totalLocations: hotspotList.length,
    criticalLocations: hotspotList.filter(h => h.riskLevel === 'Critical').length,
  };
}
