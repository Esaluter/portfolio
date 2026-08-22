window.WAREHOUSE_EVENTS = {
  "lateTruck": {
    "id": "lateTruck",
    "type": "information",
    "titleKey": "event.lateTruck.title",
    "bodyKey": "event.lateTruck.body",
    "weight": 1.0,
    "cooldown": 220,
    "minTime": 35
  },
  "inventoryCheck": {
    "id": "inventoryCheck",
    "type": "information",
    "titleKey": "event.inventoryCheck.title",
    "bodyKey": "event.inventoryCheck.body",
    "weight": 0.75,
    "cooldown": 280,
    "minTime": 90
  },
  "managerVisit": {
    "id": "managerVisit",
    "type": "information",
    "titleKey": "event.managerVisit.title",
    "bodyKey": "event.managerVisit.body",
    "weight": 0.8,
    "cooldown": 300,
    "minTime": 75
  },
  "carrierOnTime": {
    "id": "carrierOnTime",
    "type": "information",
    "titleKey": "event.carrierOnTime.title",
    "bodyKey": "event.carrierOnTime.body",
    "weight": 0.85,
    "cooldown": 220,
    "minTime": 45,
    "effect": {
      "target": "shipping",
      "factor": 1.12,
      "duration": 45
    }
  },
  "calmWindow": {
    "id": "calmWindow",
    "type": "information",
    "titleKey": "event.calmWindow.title",
    "bodyKey": "event.calmWindow.body",
    "weight": 0.65,
    "cooldown": 260,
    "minTime": 120,
    "effect": {
      "target": "all",
      "factor": 1.06,
      "duration": 40
    }
  },
  "cleanAisle": {
    "id": "cleanAisle",
    "type": "information",
    "titleKey": "event.cleanAisle.title",
    "bodyKey": "event.cleanAisle.body",
    "weight": 0.7,
    "cooldown": 260,
    "minTime": 80
  },
  "safetyBriefing": {
    "id": "safetyBriefing",
    "type": "information",
    "titleKey": "event.safetyBriefing.title",
    "bodyKey": "event.safetyBriefing.body",
    "weight": 0.65,
    "cooldown": 320,
    "minTime": 60
  },
  "coffeeMachineFixed": {
    "id": "coffeeMachineFixed",
    "type": "information",
    "titleKey": "event.coffeeMachineFixed.title",
    "bodyKey": "event.coffeeMachineFixed.body",
    "weight": 0.5,
    "cooldown": 360,
    "minTime": 120
  },
  "traineeMilestone": {
    "id": "traineeMilestone",
    "type": "information",
    "titleKey": "event.traineeMilestone.title",
    "bodyKey": "event.traineeMilestone.body",
    "weight": 0.8,
    "cooldown": 240,
    "minTime": 50,
    "condition": {
      "type": "traineesAtLeast",
      "value": 1
    }
  },
  "localRecord": {
    "id": "localRecord",
    "type": "information",
    "titleKey": "event.localRecord.title",
    "bodyKey": "event.localRecord.body",
    "weight": 0.55,
    "cooldown": 500,
    "minTime": 180,
    "condition": {
      "type": "shippedAtLeast",
      "value": 120
    }
  },
  "shiftRhythm": {
    "id": "shiftRhythm",
    "type": "information",
    "titleKey": "event.shiftRhythm.title",
    "bodyKey": "event.shiftRhythm.body",
    "weight": 0.65,
    "cooldown": 300,
    "minTime": 150,
    "effect": {
      "target": "all",
      "factor": 1.1,
      "duration": 45
    }
  },
  "packingJam": {
    "id": "packingJam",
    "type": "problem",
    "titleKey": "event.packingJam.title",
    "bodyKey": "event.packingJam.body",
    "weight": 1.0,
    "cooldown": 220,
    "minTime": 70,
    "effect": {
      "target": "packing",
      "factor": 0.68,
      "duration": 50
    }
  },
  "scannerGlitch": {
    "id": "scannerGlitch",
    "type": "problem",
    "titleKey": "event.scannerGlitch.title",
    "bodyKey": "event.scannerGlitch.body",
    "weight": 1.0,
    "cooldown": 210,
    "minTime": 55,
    "effect": {
      "target": "picking",
      "factor": 0.72,
      "duration": 42
    }
  },
  "dockCongestion": {
    "id": "dockCongestion",
    "type": "problem",
    "titleKey": "event.dockCongestion.title",
    "bodyKey": "event.dockCongestion.body",
    "weight": 0.95,
    "cooldown": 230,
    "minTime": 55,
    "effect": {
      "target": "receiving",
      "factor": 0.7,
      "duration": 46
    }
  },
  "labelPrinter": {
    "id": "labelPrinter",
    "type": "problem",
    "titleKey": "event.labelPrinter.title",
    "bodyKey": "event.labelPrinter.body",
    "weight": 0.95,
    "cooldown": 210,
    "minTime": 50,
    "effect": {
      "target": "packing",
      "factor": 0.78,
      "duration": 35
    }
  },
  "systemUpdate": {
    "id": "systemUpdate",
    "type": "problem",
    "titleKey": "event.systemUpdate.title",
    "bodyKey": "event.systemUpdate.body",
    "weight": 0.65,
    "cooldown": 360,
    "minTime": 160,
    "effect": {
      "target": "all",
      "factor": 0.86,
      "duration": 28
    }
  },
  "putawayForklift": {
    "id": "putawayForklift",
    "type": "problem",
    "titleKey": "event.putawayForklift.title",
    "bodyKey": "event.putawayForklift.body",
    "weight": 0.85,
    "cooldown": 240,
    "minTime": 80,
    "effect": {
      "target": "putaway",
      "factor": 0.72,
      "duration": 48
    }
  },
  "receivingPaperwork": {
    "id": "receivingPaperwork",
    "type": "problem",
    "titleKey": "event.receivingPaperwork.title",
    "bodyKey": "event.receivingPaperwork.body",
    "weight": 0.75,
    "cooldown": 230,
    "minTime": 70,
    "effect": {
      "target": "receiving",
      "factor": 0.78,
      "duration": 36
    }
  },
  "pickingAisleBlock": {
    "id": "pickingAisleBlock",
    "type": "problem",
    "titleKey": "event.pickingAisleBlock.title",
    "bodyKey": "event.pickingAisleBlock.body",
    "weight": 0.85,
    "cooldown": 245,
    "minTime": 85,
    "effect": {
      "target": "picking",
      "factor": 0.74,
      "duration": 40
    }
  },
  "shippingDelay": {
    "id": "shippingDelay",
    "type": "problem",
    "titleKey": "event.shippingDelay.title",
    "bodyKey": "event.shippingDelay.body",
    "weight": 0.9,
    "cooldown": 250,
    "minTime": 95,
    "effect": {
      "target": "shipping",
      "factor": 0.7,
      "duration": 50
    }
  },
  "conveyorSensor": {
    "id": "conveyorSensor",
    "type": "problem",
    "titleKey": "event.conveyorSensor.title",
    "bodyKey": "event.conveyorSensor.body",
    "weight": 0.7,
    "cooldown": 300,
    "minTime": 120,
    "effect": {
      "target": "all",
      "factor": 0.9,
      "duration": 35
    }
  },
  "suddenWave": {
    "id": "suddenWave",
    "type": "problem",
    "titleKey": "event.suddenWave.title",
    "bodyKey": "event.suddenWave.body",
    "weight": 0.75,
    "cooldown": 330,
    "minTime": 140,
    "effect": {
      "target": "incoming",
      "factor": 1.38,
      "duration": 42
    }
  },
  "staffNoShow": {
    "id": "staffNoShow",
    "type": "problem",
    "titleKey": "event.staffNoShow.title",
    "bodyKey": "event.staffNoShow.body",
    "weight": 0.55,
    "cooldown": 380,
    "minTime": 180,
    "effect": {
      "target": "all",
      "factor": 0.84,
      "duration": 60
    }
  },
  "trainingOffer": {
    "id": "trainingOffer",
    "type": "decision",
    "titleKey": "event.trainingOffer.title",
    "bodyKey": "event.trainingOffer.body",
    "weight": 0.8,
    "cooldown": 300,
    "minTime": 65,
    "condition": {
      "type": "traineesAtLeast",
      "value": 1
    },
    "choices": [
      {
        "labelKey": "event.trainingOffer.accept",
        "cost": 850,
        "action": "trainAll",
        "resultKey": "event.result.trainAll"
      },
      {
        "labelKey": "event.trainingOffer.ignore",
        "action": "none",
        "resultKey": "event.result.noChange"
      }
    ]
  },
  "missingItem": {
    "id": "missingItem",
    "type": "decision",
    "titleKey": "event.missingItem.title",
    "bodyKey": "event.missingItem.body",
    "weight": 0.55,
    "cooldown": 420,
    "minTime": 90,
    "choices": [
      {
        "labelKey": "event.missingItem.yes",
        "cost": 120,
        "action": "none",
        "resultKey": "event.result.missingFine"
      },
      {
        "labelKey": "event.missingItem.ofCourse",
        "cost": 240,
        "action": "none",
        "resultKey": "event.result.missingBigFine"
      }
    ]
  },
  "overtime": {
    "id": "overtime",
    "type": "decision",
    "titleKey": "event.overtime.title",
    "bodyKey": "event.overtime.body",
    "weight": 0.75,
    "cooldown": 310,
    "minTime": 120,
    "condition": {
      "type": "moneyAtLeast",
      "value": 650
    },
    "choices": [
      {
        "labelKey": "event.overtime.accept",
        "cost": 650,
        "effects": [
          {
            "target": "all",
            "factor": 1.18,
            "duration": 55
          }
        ],
        "resultKey": "event.result.overtime"
      },
      {
        "labelKey": "event.overtime.ignore",
        "action": "none",
        "resultKey": "event.result.noChange"
      }
    ]
  },
  "techCall": {
    "id": "techCall",
    "type": "decision",
    "titleKey": "event.techCall.title",
    "bodyKey": "event.techCall.body",
    "weight": 0.8,
    "cooldown": 280,
    "minTime": 90,
    "condition": {
      "type": "queueFillAtLeast",
      "value": 0.3
    },
    "choices": [
      {
        "labelKey": "event.techCall.accept",
        "cost": 500,
        "effects": [
          {
            "target": "packing",
            "factor": 1.35,
            "duration": 60
          }
        ],
        "resultKey": "event.result.techCall"
      },
      {
        "labelKey": "event.techCall.ignore",
        "action": "none",
        "resultKey": "event.result.noChange"
      }
    ]
  },
  "extraTrainee": {
    "id": "extraTrainee",
    "type": "decision",
    "titleKey": "event.extraTrainee.title",
    "bodyKey": "event.extraTrainee.body",
    "weight": 0.7,
    "cooldown": 320,
    "minTime": 100,
    "condition": {
      "type": "totalStaffBelow",
      "value": 26
    },
    "choices": [
      {
        "labelKey": "event.extraTrainee.accept",
        "cost": 350,
        "action": "addTrainee",
        "resultKey": "event.result.extraTrainee"
      },
      {
        "labelKey": "event.extraTrainee.ignore",
        "action": "none",
        "resultKey": "event.result.noChange"
      }
    ]
  },
  "printerDecision": {
    "id": "printerDecision",
    "type": "decision",
    "titleKey": "event.printerDecision.title",
    "bodyKey": "event.printerDecision.body",
    "weight": 0.8,
    "cooldown": 290,
    "minTime": 110,
    "choices": [
      {
        "labelKey": "event.printerDecision.tech",
        "cost": 500,
        "action": "none",
        "resultKey": "event.result.printerFixed"
      },
      {
        "labelKey": "event.printerDecision.manual",
        "effects": [
          {
            "target": "packing",
            "factor": 0.75,
            "duration": 90
          }
        ],
        "resultKey": "event.result.manualPacking"
      }
    ]
  },
  "sickCallDecision": {
    "id": "sickCallDecision",
    "type": "decision",
    "titleKey": "event.sickCallDecision.title",
    "bodyKey": "event.sickCallDecision.body",
    "weight": 0.65,
    "cooldown": 360,
    "minTime": 150,
    "condition": {
      "type": "totalStaffBelow",
      "value": 23
    },
    "choices": [
      {
        "labelKey": "event.sickCallDecision.cover",
        "cost": 800,
        "effects": [
          {
            "target": "all",
            "factor": 1.08,
            "duration": 90
          }
        ],
        "resultKey": "event.result.coverShift"
      },
      {
        "labelKey": "event.sickCallDecision.manage",
        "effects": [
          {
            "target": "all",
            "factor": 0.84,
            "duration": 80
          }
        ],
        "resultKey": "event.result.shortStaffed"
      }
    ]
  },
  "urgentBatch": {
    "id": "urgentBatch",
    "type": "decision",
    "titleKey": "event.urgentBatch.title",
    "bodyKey": "event.urgentBatch.body",
    "weight": 0.7,
    "cooldown": 330,
    "minTime": 130,
    "choices": [
      {
        "labelKey": "event.urgentBatch.accept",
        "effects": [
          {
            "target": "incoming",
            "factor": 1.4,
            "duration": 80
          },
          {
            "target": "income",
            "factor": 1.3,
            "duration": 80
          }
        ],
        "resultKey": "event.result.urgentAccepted"
      },
      {
        "labelKey": "event.urgentBatch.decline",
        "action": "none",
        "resultKey": "event.result.urgentDeclined"
      }
    ]
  },
  "preventiveMaintenance": {
    "id": "preventiveMaintenance",
    "type": "decision",
    "titleKey": "event.preventiveMaintenance.title",
    "bodyKey": "event.preventiveMaintenance.body",
    "weight": 0.55,
    "cooldown": 420,
    "minTime": 200,
    "condition": {
      "type": "moneyAtLeast",
      "value": 550
    },
    "choices": [
      {
        "labelKey": "event.preventiveMaintenance.accept",
        "cost": 550,
        "effects": [
          {
            "target": "all",
            "factor": 1.1,
            "duration": 100
          }
        ],
        "resultKey": "event.result.maintenanceDone"
      },
      {
        "labelKey": "event.preventiveMaintenance.skip",
        "action": "none",
        "resultKey": "event.result.noChange"
      }
    ]
  },
  "coffeeBudget": {
    "id": "coffeeBudget",
    "type": "decision",
    "titleKey": "event.coffeeBudget.title",
    "bodyKey": "event.coffeeBudget.body",
    "weight": 0.45,
    "cooldown": 450,
    "minTime": 170,
    "condition": {
      "type": "moneyAtLeast",
      "value": 250
    },
    "choices": [
      {
        "labelKey": "event.coffeeBudget.accept",
        "cost": 250,
        "effects": [
          {
            "target": "all",
            "factor": 1.05,
            "duration": 70
          }
        ],
        "resultKey": "event.result.coffeeApproved"
      },
      {
        "labelKey": "event.coffeeBudget.decline",
        "action": "none",
        "resultKey": "event.result.noChange"
      }
    ]
  },
  "overflowCarrier": {
    "id": "overflowCarrier",
    "type": "decision",
    "titleKey": "event.overflowCarrier.title",
    "bodyKey": "event.overflowCarrier.body",
    "weight": 0.65,
    "cooldown": 340,
    "minTime": 180,
    "condition": {
      "type": "queueFillAtLeast",
      "value": 0.5
    },
    "choices": [
      {
        "labelKey": "event.overflowCarrier.accept",
        "cost": 700,
        "effects": [
          {
            "target": "shipping",
            "factor": 1.4,
            "duration": 90
          }
        ],
        "resultKey": "event.result.extraCarrier"
      },
      {
        "labelKey": "event.overflowCarrier.decline",
        "effects": [
          {
            "target": "shipping",
            "factor": 0.86,
            "duration": 70
          }
        ],
        "resultKey": "event.result.carrierDeclined"
      }
    ]
  },
  "weekendVolunteer": {
    "id": "weekendVolunteer",
    "type": "decision",
    "titleKey": "event.weekendVolunteer.title",
    "bodyKey": "event.weekendVolunteer.body",
    "weight": 0.55,
    "cooldown": 400,
    "minTime": 200,
    "condition": {
      "type": "freeStaffBelow",
      "value": 3
    },
    "choices": [
      {
        "labelKey": "event.weekendVolunteer.accept",
        "cost": 450,
        "action": "addWorker",
        "resultKey": "event.result.workerJoined"
      },
      {
        "labelKey": "event.weekendVolunteer.decline",
        "action": "none",
        "resultKey": "event.result.noChange"
      }
    ]
  },
  "expediteSupplies": {
    "id": "expediteSupplies",
    "type": "decision",
    "titleKey": "event.expediteSupplies.title",
    "bodyKey": "event.expediteSupplies.body",
    "weight": 0.65,
    "cooldown": 330,
    "minTime": 140,
    "condition": {
      "type": "moneyAtLeast",
      "value": 600
    },
    "choices": [
      {
        "labelKey": "event.expediteSupplies.accept",
        "cost": 600,
        "effects": [
          {
            "target": "packing",
            "factor": 1.25,
            "duration": 75
          }
        ],
        "resultKey": "event.result.suppliesExpedited"
      },
      {
        "labelKey": "event.expediteSupplies.decline",
        "action": "none",
        "resultKey": "event.result.noChange"
      }
    ]
  },
  "auditChoice": {
    "id": "auditChoice",
    "type": "decision",
    "titleKey": "event.auditChoice.title",
    "bodyKey": "event.auditChoice.body",
    "weight": 0.5,
    "cooldown": 440,
    "minTime": 210,
    "choices": [
      {
        "labelKey": "event.auditChoice.prepare",
        "cost": 400,
        "effects": [
          {
            "target": "all",
            "factor": 1.05,
            "duration": 60
          }
        ],
        "resultKey": "event.result.auditPrepared"
      },
      {
        "labelKey": "event.auditChoice.improvise",
        "effects": [
          {
            "target": "all",
            "factor": 0.9,
            "duration": 60
          }
        ],
        "resultKey": "event.result.auditChaos"
      }
    ]
  },
  "wmsRollback": {
    "id": "wmsRollback",
    "type": "decision",
    "titleKey": "event.wmsRollback.title",
    "bodyKey": "event.wmsRollback.body",
    "weight": 0.55,
    "cooldown": 420,
    "minTime": 220,
    "choices": [
      {
        "labelKey": "event.wmsRollback.vendor",
        "cost": 500,
        "effects": [
          {
            "target": "all",
            "factor": 1.08,
            "duration": 70
          }
        ],
        "resultKey": "event.result.vendorHelp"
      },
      {
        "labelKey": "event.wmsRollback.manual",
        "effects": [
          {
            "target": "all",
            "factor": 0.82,
            "duration": 70
          }
        ],
        "resultKey": "event.result.manualMode"
      }
    ]
  }
};
