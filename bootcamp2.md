# CampusQuest: Santiago de Cali University (USC) Gymkhana

This repository contains the institutional script and technical data model for a university-wide gymkhana designed for **15–20 students** divided into **teams of 3** [Conversation History]. The event focuses on exploring the **Pampalinda Citadel** (Calle 5 # 62-00) and learning about USC’s history and services.

## 1. Gymkhana Script

### Station 1: Engineering Faculty (Block 7)
*   **The Challenge:** Identify the roots of the faculty.
*   **Question:** In what year was the faculty officially restructured into its current form, and what was its original name?
*   **Required Answer:** It was created on **August 8, 2002** (Agreement CS 04), and was originally called the **Academic Circle in Engineering**.
*   **Secondary Task:** Name the two main research groups supporting the faculty.
*   **Answer:** **GIEIAM** and **COMBA I+D**.

### Station 2: Santiago Cadena Copete Library (Block 3, Floor 3)
*   **The Challenge:** Navigate the research databases.
*   **Question:** Which company provides the database used for peer-reviewed literature and tracking research citations at USC?
*   **Required Answer:** **Elsevier**.
*   **Activity:** Teams must find a physical book from the **USC Publishing House** collection.

### Station 3: Laboratories Building (Block 4)
*   **The Challenge:** Discover high-tech simulation.
*   **Question:** What is the specific room nomenclature for the **Simulated Hospital**, and who is the current **Director of Laboratories**?
*   **Required Answer:** Nomenclature **4208** (Floor 2), directed by **Diana Marcela Torres Rojas**.

### Station 4: Well-being Building (Wellness Area)
*   **The Challenge:** Embody the institutional spirit.
*   **Question:** USC has defined seven guiding principles for its actions. Name at least four.
*   **Required Answer:** **Quality, Democracy, Equity, Ethics, Inclusion, Human Rights, and Social Responsibility**.
*   **Activity:** Perform a team pose representing the **Health Coordination’s** mission of fostering healthy lifestyles.

### Station 5: Games and Recreation Building (Recreational Center)
*   **The Challenge:** Physical and institutional pride.
*   **Question:** What is the primary responsibility of the **Sports and Recreation Coordination**?
*   **Required Answer:** Promoting, encouraging, and organizing **competitive, formative, and recreational sports**, as well as the good use of free time.
*   **Final Task:** Recite the chorus of the **USC Hymn**: *"Let us sing, let us sing, Santiaguinos, let us sing to the University..."*.

---

## 2. MongoDB Data Model

The following JSON structures represent the collections needed to manage the gymkhana. All locations are **geolocated** using GeoJSON for proximity validation.

### Collection: `locations`
Stores the campus blocks and coordinates.

```json
[
  {
    "loc_id": "LOC_ENG_07",
    "name": "Engineering Faculty",
    "block": 7,
    "location": {
      "type": "Point",
      "coordinates": [-76.5485, 3.4021]
    }
  },
  {
    "loc_id": "LOC_LIB_03",
    "name": "Santiago Cadena Copete Library",
    "block": 3,
    "floor": 3,
    "location": {
      "type": "Point",
      "coordinates": [-76.5490, 3.4025]
    }
  }
]
```

### Collection: `questions`
Contains the challenges linked to specific locations.

```json
[
  {
    "q_id": "Q_001",
    "loc_id": "LOC_ENG_07",
    "text": "What was the original name of the Faculty of Engineering?",
    "answer": "Academic Circle in Engineering",
    "points": 10
  },
  {
    "q_id": "Q_002",
    "loc_id": "LOC_LIB_03",
    "text": "Name the provider of the bibliographic citation database.",
    "answer": "Elsevier",
    "points": 10
  }
]
```

### Collection: `teams`
Manages team membership (max 3 students) and progress.

```json
[
  {
    "team_id": "TEAM_01",
    "team_name": "Santiaguino Pioneers",
    "members": ["Student A", "Student B", "Student C"],
    "completed_stations": ["LOC_ENG_07"],
    "total_score": 10,
    "is_active": true
  }
]
```

### Collection: `responses`
Tracks real-time submissions and team location during the answer.

```json
[
  {
    "response_id": "RES_101",
    "team_id": "TEAM_01",
    "q_id": "Q_001",
    "submission": "Academic Circle in Engineering",
    "is_correct": true,
    "geo_stamp": {
      "type": "Point",
      "coordinates": [-76.5485, 3.4021]
    },
    "timestamp": "2026-04-06T14:00:00Z"
  }
]
```



## 3. Technical Implementation Notes
*   **Geofencing:** Use the `$near` operator in MongoDB on the `location` field to ensure teams are within 50 meters of a building before allowing a question submission.


## 4. # Session 2:
## Objectives:

*  Define and implement the documental data model of the "Campus Quest" gymkhana
*  Implement a basic backend on React Native
*  Implement a basic welcome screen, and a screen with a campus map with interest points ("stations")   
