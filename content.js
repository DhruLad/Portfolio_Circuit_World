/*
  content.js: every word and fact shown in the game lives here.
  To add a project, copy one block inside `projects`, change the text, save.
  The board, the project panels and Quick View all rebuild from this file.

  Optional fields per project:
    sprite  building art: "fpga", "shield", "oscilloscope", "garage", "motor",
            "rocket", "dome". Anything else (or nothing) draws a plain chip.
    demo    mini-demo name from js/demos.js: "adder", "sensors", "waveforms",
            "robot", "motor", "rocket", "models". Leave out for no demo.
    socket  1 to 12, clockwise from the top-left. Leave out to fill in order.
    photos  file names inside assets/projects/<id>/
    links   [{ label: "Code", url: "https://..." }]
    story   { problem, action, why, result }: the "How I approached it" walkthrough
*/
window.PORTFOLIO = {
  profile: {
    name: "Dhru Lad",
    tagline: "Electrical Engineering & Artificial Intelligence Systems Engineering, Western University",
    location: "Toronto, ON",
    linkedin: "https://www.linkedin.com/in/dhru-lad/",
    email: "",            // TODO: add the address you want public, e.g. "you@example.com"
    resume: "",           // TODO: add "assets/resume.pdf" once a public copy (no phone number) is in that folder
    education: {
      school: "University of Western Ontario, London, ON",
      degree: "Bachelor of Electrical Engineering & Artificial Intelligence Systems Engineering",
      dates: "September 2022 – April 2028",
      coursework: "Digital Logic, Microprocessors, Electronic Systems Design, Circuit Theory, Control Systems, Data Engineering & Machine Learning, Deep Learning"
    },
    awards: [
      "Dean's Honor List (2026)",
      "Wellington Financial LP Award in Technology Evaluation and Analysis (2026)",
      "Western Engineering Diversity Ambassador Award (2026)"
    ],
    skills: [
      { group: "Hardware description & scripting", items: "Verilog, TCL, Shell Scripting, Python, C/C++, MATLAB, SQL (MySQL), Assembly, Java" },
      { group: "Digital design", items: "Digital Logic Design, Finite State Machines, RTL Simulation, FPGA Synthesis & Implementation, Linux/UNIX" },
      { group: "Hardware & electronics", items: "Circuit Analysis, Schematic Capture, PCB Design & Layout, Signal Integrity, Power Electronics, Microcontrollers & Embedded Systems, Oscilloscope-Based Validation & Debug" },
      { group: "EDA & simulation", items: "Intel Quartus Prime, Micro-Cap (SPICE), EAGLE, MATLAB, AutoCAD, SolidWorks" },
      { group: "Machine learning", items: "PyTorch, TensorFlow/Keras, Scikit-Learn, Optuna; TCN, GRU, RNN; OpenCV" }
    ],
    experience: [
      { role: "Field Engineering Intern", org: "EllisDon & PCL, Parliament of Canada, Ottawa", dates: "Sept 2024 – Sept 2026",
        line: "Analyzed mechanical and electrical drawings to resolve 150+ deficiencies a month and coordinated field activities for 20+ subcontractors." },
      { role: "Sustainability Commissioner", org: "Undergraduate Engineering Society, London", dates: "May 2026 – Present",
        line: "Plans wellness and professional development initiatives for undergraduate engineering students." },
      { role: "Residence Don (Upper-Year)", org: "Western University Housing, London", dates: "Aug 2026 – Present",
        line: "Leads a residence community of 85 upper-year students across 3 floors." },
      { role: "Residence Education Advisor", org: "Western University Housing, London", dates: "Aug 2025 – May 2026",
        line: "Designed and ran 10+ academic and leadership programs for a 350-resident building." },
      { role: "Donor Relations & Events Planning Coordinator", org: "Canadian Blood Services, London", dates: "Apr 2024 – Sept 2024",
        line: "Planned 100+ community recruitment events and registered 5,000+ new donors." }
    ]
  },

  projects: [
    {
      id: "fpga-logic",
      zone: "Logic Fortress",
      title: "Digital Logic Design in Verilog (FPGA)",
      date: "Dec 2025",
      org: "Western University",
      summary: "RTL modules written in Verilog, simulated, synthesized in Intel Quartus and verified on an FPGA board.",
      story: {
        problem: "The goal was a modular digital control system running on a real FPGA board, not just passing in simulation. That gap is the hard part: a design can look correct in a simulator and still misbehave on hardware because of timing.",
        action: "I built it bottom-up in Verilog. I started with small combinational blocks, adders and multiplexers, then counters and registers, then the finite state machines that tie them together. I simulated each module and read the waveforms before synthesizing in Quartus, and I wrote TCL scripts to handle pin assignments and the compile flow.",
        why: "Bottom-up, because when something breaks on the board I want every block underneath to be already verified, so the bug has to be in the integration. Simulation first, because a waveform shows the exact clock edge where the logic goes wrong. And TCL, because assigning pins by hand is where careless mistakes creep in; a script makes every build identical.",
        result: "The design ran on the board across all of its operating states. The timing and logic issues that only showed up on hardware, I fixed by going back and refining the RTL rather than patching around them."
      },
      built: [
        "Combinational logic (adders, multiplexers) and sequential logic (counters, finite state machines)",
        "A modular digital control system with FSMs, registers, counters and hardware I/O interfaces",
        "TCL scripts that automate pin assignments and compile flows",
        "Simulation and waveform analysis to debug timing and logic errors before synthesis in Quartus Prime Lite"
      ],
      results: ["Programmed and validated on FPGA hardware across operating states"],
      skills: ["Verilog", "Intel Quartus Prime", "TCL", "Finite state machines", "RTL simulation"],
      sprite: "fpga",
      demo: "adder",
      photos: [],
      links: []
    },
    {
      id: "pcb-shield",
      zone: "Shield Workshop",
      title: "PCB Design: Arduino UNO Shield",
      date: "Jan 2026",
      org: "Western University",
      summary: "A custom single-layer PCB shield that connects an Arduino UNO to 11 peripherals, designed in Altium Designer.",
      story: {
        problem: "I had to connect an Arduino UNO to 11 peripherals on a single-layer board. With one copper layer, traces cannot cross. And the board mixed a 12 V, 2 A solenoid supply with low-voltage sensors and logic.",
        action: "I laid it out in Altium Designer with 45° routing and thermal pads, and where two nets had to cross I used external ground plane bridges. I gave the solenoid its own 12 V rail and switched it through an optocoupled relay, and I added resistive voltage dividers on the sensor side. Then I soldered the through-hole parts and wrote C++ firmware that reads the sensors and sends the data over UART to an ESP32 web server.",
        why: "The bridges were the simplest way around the single-layer limit without redesigning the whole layout. The optocoupler was about protection: a solenoid is an inductive load on a higher voltage, and I did not want its switching noise, or a fault on that side, reaching the microcontroller. The dividers kept the sensors within safe operating levels so they would not overheat.",
        result: "When I first powered it, I had power shorts and open traces. Instead of reflowing joints at random, I went net by net against the schematic with a continuity tester until I found each one. After that the shield ran its peripherals and reported sensor data through the ESP32."
      },
      built: [
        "45° trace routing, thermal pad layout and external ground plane bridges to work within single-layer constraints",
        "Mixed-signal circuitry: a 12 V / 2 A external DC rail for solenoid actuation, optocoupled relay isolation and resistive voltage dividers",
        "Through-hole assembly; resolved board-level power shorts and open traces by schematic cross-referencing and continuity testing",
        "C++ firmware for sensor acquisition and UART communication to an ESP32 web server"
      ],
      results: ["11 peripherals on one single-layer board", "12 V / 2 A solenoid rail with optocoupled isolation"],
      skills: ["Altium Designer", "PCB layout", "C++", "Arduino", "UART", "ESP32", "Soldering"],
      sprite: "shield",
      demo: "sensors",
      photos: [],
      links: []
    },
    {
      id: "function-generator",
      zone: "Signal Lab",
      title: "Function Generator: PCB Design & Circuit Simulation",
      date: "Jan 2025",
      org: "Western University",
      summary: "A function generator for sine, square and triangle waves up to 10 kHz, taken from schematic to working PCB.",
      story: {
        problem: "We needed a signal source for testing circuits in the lab: something that produces sine, square and triangle waves across a useful frequency range. I took it from a blank page to a working board.",
        action: "I worked in three passes. First hand analysis, to size the components. Then Micro-Cap simulation, checking each waveform across several frequency ranges. Only then did I do schematic capture and PCB layout in EAGLE, and assemble and solder the board. For bring-up I checked every output on an oscilloscope and with a multimeter.",
        why: "I did the hand calculations first so I knew what the simulation should show. I simulated before fabricating because a mistake caught in Micro-Cap costs minutes, while a mistake caught on a finished board costs a new board. The scope came last because simulation uses ideal parts, and I wanted to see the real waveform.",
        result: "The prototype worked. Waveform accuracy came in within ±5% of the design, and the generator covered frequencies up to 10 kHz, which widened what we could test in the lab."
      },
      built: [
        "Schematic capture and PCB layout in EAGLE",
        "Validated by hand analysis and Micro-Cap simulation before fabrication",
        "Assembled, soldered and verified with an oscilloscope and multimeter"
      ],
      results: ["Waveform accuracy within ±5%", "Frequencies up to 10 kHz"],
      skills: ["EAGLE", "Micro-Cap", "PCB layout", "Soldering", "Oscilloscope"],
      sprite: "oscilloscope",
      demo: "waveforms",
      photos: [],
      links: []
    },
    {
      id: "autonomous-robot",
      zone: "Robot Garage",
      title: "Autonomous Driving Vehicle Development (Embedded Systems & Computer Vision)",
      date: "Jan 2026",
      org: "Western University",
      summary: "An autonomous robot that navigates, avoids obstacles, and retrieves and sorts objects, built on Arduino with C++ and Python.",
      story: {
        problem: "The robot had to work with nobody driving it: move around a course, avoid obstacles, find objects, pick them up, and sort the valuable ones from the rest. So it was a sensing problem, a mechanical problem and a power problem at the same time.",
        action: "I built it on an Arduino in C++. Ultrasonic and IR sensors fed the navigation, obstacle avoidance and a closed-loop lane-keeping routine. For pickup I used servo-driven manipulators on assemblies I modelled in SolidWorks, with DC motors for drive. I also designed the power distribution and motor control: voltage regulation, driver circuitry and protection between the Arduino and the motors, servos and sensors.",
        why: "Closed-loop, because open-loop driving drifts; two motors never match exactly, so the robot has to keep correcting from what the sensors see. I treated power as its own subsystem because motors and servos pull current in bursts, and a microcontroller sharing that rail unprotected can reset mid-run. And I modelled the mechanics in SolidWorks first so I could check fit and reach before building anything.",
        result: "The robot traversed the course autonomously, homed back, and sorted valuable from non-valuable objects with 100% accuracy."
      },
      built: [
        "Embedded C++ and Python algorithms that process real-time ultrasonic and IR sensor inputs for navigation, obstacle avoidance and closed-loop lane-keeping",
        "Servo-driven manipulators, DC motor locomotion and custom mechanical assemblies modeled in SolidWorks",
        "A custom power-distribution and motor-control subsystem: voltage regulation, driver circuitry and protection components",
        "Real-time navigation, homing and object-sorting algorithms"
      ],
      results: ["100% sorting accuracy between valuable and non-valuable objects"],
      skills: ["C++", "Python", "Arduino", "SolidWorks", "Motor control", "Sensor integration"],
      sprite: "garage",
      demo: "robot",
      photos: [],
      links: []
    },
    {
      id: "bldc-motor",
      zone: "Motor Works",
      title: "BLDC Motor",
      date: "Dec 2025",
      org: "Western University",
      summary: "A custom brushless DC motor, designed and assembled for light-duty applications.",
      story: {
        problem: "I had to design and build a brushless DC motor from scratch, inside hard electrical limits: 15 V, 5 A and 75 W. The challenge was getting useful speed and torque without breaking any of them.",
        action: "I started on paper. I calculated the motor constants, Kv and Kt, and used them to choose the number of winding turns. For the magnetic circuit I used N52 magnets with the windings in a Wye configuration. Then I designed the mechanical parts in SolidWorks and 3D printed them.",
        why: "I began with Kv and Kt because they connect the electrical limits to what the motor does mechanically: Kv ties voltage to speed and Kt ties current to torque. More turns give more torque per amp but less speed per volt, so I wanted to choose the turn count by calculation, not by rewinding. N52 magnets give strong flux in a small rotor. And 3D printing let me adjust fit and assembly quickly.",
        result: "The motor reached a peak of 3000 RPM with 0.12 Nm of torque at 63% efficiency, within the limits. Optimizing the magnetic circuit also cut cogging torque by 40%, which made startup smoother."
      },
      built: [
        "Calculated electromagnetic constants (Kv, Kt) and optimized winding turns to stay within 15 V, 5 A and 75 W",
        "Mechanical components designed in SolidWorks and 3D printed",
        "Magnetic circuit built on N52 magnets in a Wye configuration"
      ],
      results: ["3000 RPM peak speed", "0.12 Nm torque", "63% efficiency", "Cogging torque reduced by 40%"],
      skills: ["Motor design", "Electromagnetics", "SolidWorks", "3D printing", "Power electronics"],
      sprite: "motor",
      demo: "motor",
      photos: [],
      links: []
    },
    {
      id: "rocketry-avionics",
      zone: "Launch Pad",
      title: "Avionics Lead Engineer, Western Engineering Rocketry Team",
      date: "Sept 2023 – Present",
      org: "London, ON",
      summary: "Leads avionics for high-powered rockets: sensors, telemetry, navigation and air brakes.",
      built: [
        "Designed and tested avionics systems for high-powered rockets",
        "Integrated microcontrollers and sensors for real-time data transmission and flight tracking",
        "Developed modular diagnostic procedures and applied signal analysis tools for rapid fault identification",
        "Led a cross-functional electronics sub-team within a 50-member group, improving avionics-to-payload interface design"
      ],
      results: ["System reliability up 40%", "Validated over two full-scale launches", "Troubleshooting time down 50%"],
      skills: ["Avionics", "Embedded systems", "Telemetry", "Sensor integration", "Team leadership"],
      sprite: "rocket",
      demo: "rocket",
      photos: [],
      links: []
    },
    {
      id: "housing-forecast",
      zone: "Data Observatory",
      title: "Predictive Analysis of U.S. Housing Markets (Machine Learning)",
      date: "Sep 2025",
      org: "Western University",
      summary: "A deep learning framework that compares RNN, GRU and TCN models against SARIMA baselines to forecast monthly U.S. construction permits.",
      story: {
        problem: "I wanted to forecast monthly U.S. construction permits. The data is sparse and high-variance, so the real question was whether deep learning actually beats a classical statistical model on data like that.",
        action: "I built one framework in Python that trained three neural architectures, an RNN, a GRU and a Temporal Convolutional Network, and compared all of them against SARIMA baselines. For tuning I ran Bayesian hyperparameter optimization with Keras Tuner and Optuna on a T4 GPU.",
        why: "The baseline came first because without it I could not claim the neural models added anything. I compared three architectures rather than picking one because they handle history differently, and I did not want to assume which would suit this data. And I used Bayesian search instead of a grid because every trial is a full training run; it uses earlier trials to choose the next one.",
        result: "The tuned TCN was the model that excelled on the sparse, high-variance data."
      },
      built: [
        "Supervised deep learning framework in Python",
        "RNN, GRU and Temporal Convolutional Network architectures compared against SARIMA baselines",
        "Bayesian hyperparameter optimization with Keras Tuner and Optuna on T4 GPU hardware"
      ],
      results: ["The tuned TCN model excelled on sparse, high-variance data"],
      skills: ["Python", "TensorFlow/Keras", "Optuna", "Keras Tuner", "Time-series forecasting"],
      sprite: "dome",
      demo: "models",
      photos: [],
      links: []
    }
  ]
};
