window.WAREHOUSE_SCENARIOS = {
  "endless": {
    "id": "endless",
    "titleKey": "scenario.endless.title",
    "descriptionKey": "scenario.endless.desc",
    "difficulty": 2,
    "difficultyKey": "scenario.endless.difficulty",
    "styleKey": "scenario.endless.style",
    "startBudget": 3400,
    "incomePerUnit": 24,
    "baseIncomingPerMinute": 23,
    "growthPerGameMinute": 0.022,
    "peak": {
      "enabled": true,
      "everyMin": 105,
      "everyMax": 165,
      "durationMin": 22,
      "durationMax": 40,
      "multiplierMin": 1.35,
      "multiplierMax": 1.75
    },
    "eventFrequency": {
      "min": 60,
      "max": 105
    },
    "eventPool": [
      "lateTruck",
      "inventoryCheck",
      "managerVisit",
      "carrierOnTime",
      "calmWindow",
      "cleanAisle",
      "safetyBriefing",
      "coffeeMachineFixed",
      "traineeMilestone",
      "localRecord",
      "shiftRhythm",
      "packingJam",
      "scannerGlitch",
      "dockCongestion",
      "labelPrinter",
      "systemUpdate",
      "putawayForklift",
      "receivingPaperwork",
      "pickingAisleBlock",
      "shippingDelay",
      "conveyorSensor",
      "suddenWave",
      "staffNoShow",
      "trainingOffer",
      "missingItem",
      "overtime",
      "techCall",
      "extraTrainee",
      "printerDecision",
      "sickCallDecision",
      "urgentBatch",
      "preventiveMaintenance",
      "coffeeBudget",
      "overflowCarrier",
      "weekendVolunteer",
      "expediteSupplies",
      "auditChoice",
      "wmsRollback"
    ],
    "plannedEvents": [],
    "modifiers": {},
    "workerProductivity": 1,
    "traineeProductivity": 0.58,
    "trainingDuration": 95,
    "processBasePerWorker": {
      "receiving": 13.2,
      "putaway": 12.8,
      "picking": 12.6,
      "packing": 12.2,
      "shipping": 13.0
    },
    "bufferCapacity": [
      70,
      70,
      70,
      70
    ],
    "initialStaff": {
      "receiving": {
        "worker": 2,
        "trainee": 0
      },
      "putaway": {
        "worker": 2,
        "trainee": 0
      },
      "picking": {
        "worker": 2,
        "trainee": 0
      },
      "packing": {
        "worker": 2,
        "trainee": 0
      },
      "shipping": {
        "worker": 2,
        "trainee": 0
      },
      "free": {
        "worker": 2,
        "trainee": 0
      }
    },
    "hireCost": 620,
    "zoneUpgradeBaseCost": 720,
    "bufferUpgradeBaseCost": 560,
    "globalUpgradeBaseCost": 900,
    "upgradeCostGrowth": 1.6,
    "zoneUpgradeBonus": 0.16,
    "bufferUpgradeBonus": 30,
    "slaTargetAge": 105,
    "criticalSla": 68,
    "shutdownAfter": 42,
    "maxZoneLevel": 5,
    "maxBufferLevel": 5,
    "maxGlobalLevel": 4
  },
  "normal": {
    "id": "normal",
    "titleKey": "scenario.normal.title",
    "descriptionKey": "scenario.normal.desc",
    "difficulty": 1,
    "difficultyKey": "scenario.normal.difficulty",
    "styleKey": "scenario.normal.style",
    "startBudget": 4200,
    "incomePerUnit": 23,
    "baseIncomingPerMinute": 21.5,
    "growthPerGameMinute": 0.012,
    "peak": {
      "enabled": true,
      "everyMin": 150,
      "everyMax": 220,
      "durationMin": 18,
      "durationMax": 30,
      "multiplierMin": 1.2,
      "multiplierMax": 1.4
    },
    "eventFrequency": {
      "min": 72,
      "max": 120
    },
    "eventPool": [
      "lateTruck",
      "inventoryCheck",
      "managerVisit",
      "carrierOnTime",
      "calmWindow",
      "cleanAisle",
      "safetyBriefing",
      "coffeeMachineFixed",
      "traineeMilestone",
      "localRecord",
      "shiftRhythm",
      "packingJam",
      "scannerGlitch",
      "dockCongestion",
      "labelPrinter",
      "systemUpdate",
      "putawayForklift",
      "receivingPaperwork",
      "pickingAisleBlock",
      "shippingDelay",
      "conveyorSensor",
      "trainingOffer",
      "missingItem",
      "overtime",
      "techCall",
      "extraTrainee",
      "printerDecision",
      "sickCallDecision",
      "urgentBatch",
      "preventiveMaintenance",
      "coffeeBudget",
      "weekendVolunteer",
      "expediteSupplies",
      "auditChoice"
    ],
    "plannedEvents": [],
    "modifiers": {},
    "workerProductivity": 1,
    "traineeProductivity": 0.62,
    "trainingDuration": 85,
    "processBasePerWorker": {
      "receiving": 13.4,
      "putaway": 13.0,
      "picking": 12.8,
      "packing": 10.4,
      "shipping": 13.2
    },
    "bufferCapacity": [
      80,
      80,
      80,
      80
    ],
    "initialStaff": {
      "receiving": {
        "worker": 2,
        "trainee": 0
      },
      "putaway": {
        "worker": 2,
        "trainee": 0
      },
      "picking": {
        "worker": 2,
        "trainee": 0
      },
      "packing": {
        "worker": 2,
        "trainee": 0
      },
      "shipping": {
        "worker": 2,
        "trainee": 0
      },
      "free": {
        "worker": 3,
        "trainee": 0
      }
    },
    "hireCost": 560,
    "zoneUpgradeBaseCost": 680,
    "bufferUpgradeBaseCost": 520,
    "globalUpgradeBaseCost": 850,
    "upgradeCostGrowth": 1.55,
    "zoneUpgradeBonus": 0.16,
    "bufferUpgradeBonus": 35,
    "slaTargetAge": 120,
    "criticalSla": 65,
    "shutdownAfter": 50,
    "maxZoneLevel": 5,
    "maxBufferLevel": 5,
    "maxGlobalLevel": 4
  },
  "blackFriday": {
    "id": "blackFriday",
    "titleKey": "scenario.blackFriday.title",
    "descriptionKey": "scenario.blackFriday.desc",
    "difficulty": 3,
    "difficultyKey": "scenario.blackFriday.difficulty",
    "styleKey": "scenario.blackFriday.style",
    "startBudget": 5200,
    "incomePerUnit": 29,
    "baseIncomingPerMinute": 31,
    "growthPerGameMinute": 0.032,
    "peak": {
      "enabled": true,
      "everyMin": 60,
      "everyMax": 105,
      "durationMin": 30,
      "durationMax": 48,
      "multiplierMin": 1.45,
      "multiplierMax": 1.95
    },
    "eventFrequency": {
      "min": 45,
      "max": 82
    },
    "eventPool": [
      "lateTruck",
      "inventoryCheck",
      "managerVisit",
      "carrierOnTime",
      "calmWindow",
      "cleanAisle",
      "safetyBriefing",
      "coffeeMachineFixed",
      "traineeMilestone",
      "localRecord",
      "shiftRhythm",
      "packingJam",
      "scannerGlitch",
      "dockCongestion",
      "labelPrinter",
      "systemUpdate",
      "putawayForklift",
      "receivingPaperwork",
      "pickingAisleBlock",
      "shippingDelay",
      "conveyorSensor",
      "suddenWave",
      "staffNoShow",
      "trainingOffer",
      "missingItem",
      "overtime",
      "techCall",
      "extraTrainee",
      "printerDecision",
      "sickCallDecision",
      "urgentBatch",
      "preventiveMaintenance",
      "coffeeBudget",
      "overflowCarrier",
      "weekendVolunteer",
      "expediteSupplies",
      "auditChoice",
      "wmsRollback"
    ],
    "plannedEvents": [],
    "modifiers": {},
    "workerProductivity": 1,
    "traineeProductivity": 0.55,
    "trainingDuration": 110,
    "processBasePerWorker": {
      "receiving": 12.8,
      "putaway": 12.3,
      "picking": 12.0,
      "packing": 11.5,
      "shipping": 12.4
    },
    "bufferCapacity": [
      75,
      75,
      75,
      75
    ],
    "initialStaff": {
      "receiving": {
        "worker": 3,
        "trainee": 0
      },
      "putaway": {
        "worker": 3,
        "trainee": 0
      },
      "picking": {
        "worker": 3,
        "trainee": 0
      },
      "packing": {
        "worker": 3,
        "trainee": 0
      },
      "shipping": {
        "worker": 3,
        "trainee": 0
      },
      "free": {
        "worker": 3,
        "trainee": 1
      }
    },
    "hireCost": 700,
    "zoneUpgradeBaseCost": 850,
    "bufferUpgradeBaseCost": 650,
    "globalUpgradeBaseCost": 1050,
    "upgradeCostGrowth": 1.65,
    "zoneUpgradeBonus": 0.15,
    "bufferUpgradeBonus": 28,
    "slaTargetAge": 95,
    "criticalSla": 70,
    "shutdownAfter": 36,
    "maxZoneLevel": 5,
    "maxBufferLevel": 5,
    "maxGlobalLevel": 4
  }
};
