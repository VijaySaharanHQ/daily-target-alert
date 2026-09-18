/* ==========================================
   DAILY TARGET ALERT V2
   Default Data
========================================== */

const SUBJECT_DATA = {

  JEE: {
    Physics: {
      icon: "⚡",
      color: "#5b8cff"
    },

    Chemistry: {
      icon: "🧪",
      color: "#32d583"
    },

    Mathematics: {
      icon: "📐",
      color: "#ffb547"
    }
  },

  NEET: {
    Physics: {
      icon: "⚡",
      color: "#5b8cff"
    },

    Chemistry: {
      icon: "🧪",
      color: "#32d583"
    },

    Biology: {
      icon: "🧬",
      color: "#8b84ff"
    }
  }

};


const DEFAULT_TARGETS = {

  JEE: [
    {
      id: crypto.randomUUID(),
      subject: "Physics",
      chapter: "Current Electricity",
      title: "Revise Current Electricity",
      duration: 60,
      completed: false,
      order: 1
    },

    {
      id: crypto.randomUUID(),
      subject: "Chemistry",
      chapter: "Chemical Kinetics",
      title: "Chemical Kinetics — Concepts + PYQs",
      duration: 75,
      completed: false,
      order: 2
    },

    {
      id: crypto.randomUUID(),
      subject: "Mathematics",
      chapter: "Matrices",
      title: "Matrices — Practice Questions",
      duration: 60,
      completed: false,
      order: 3
    },

    {
      id: crypto.randomUUID(),
      subject: "Physics",
      chapter: "Electrostatics",
      title: "Electrostatics Revision",
      duration: 45,
      completed: false,
      order: 4
    }
  ],


  NEET: [
    {
      id: crypto.randomUUID(),
      subject: "Physics",
      chapter: "Current Electricity",
      title: "Current Electricity Revision",
      duration: 60,
      completed: false,
      order: 1
    },

    {
      id: crypto.randomUUID(),
      subject: "Chemistry",
      chapter: "Chemical Bonding",
      title: "Chemical Bonding Concepts",
      duration: 60,
      completed: false,
      order: 2
    },

    {
      id: crypto.randomUUID(),
      subject: "Biology",
      chapter: "Human Physiology",
      title: "Human Physiology NCERT",
      duration: 90,
      completed: false,
      order: 3
    }
  ]

};
