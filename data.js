```javascript
/*
  DAILY TARGET ALERT
  Default configuration
*/

const APP_CONFIG = {

  appName: "Daily Target Alert",

  version: "1.0.0",

  defaultExam: "JEE",

  defaultDeadline: "23:00",

  subjects: {
    JEE: [
      "Physics",
      "Chemistry",
      "Mathematics",
      "English",
      "Other"
    ],

    NEET: [
      "Physics",
      "Chemistry",
      "Biology",
      "English",
      "Other"
    ]
  },

  storageKey: "dailyTargetAlertData",

  defaultData: {
    exam: "JEE",

    targets: [],

    history: {},

    notes: {},

    settings: {
      deadline: "23:00",
      darkMode: false,
      notifications: false
    }
  }

};
```
