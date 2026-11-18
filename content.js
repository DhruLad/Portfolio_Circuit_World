/*
  content.js: every word and fact shown in the game lives here.
  To add a project, copy one block inside `projects`, change the text, save.
  The board, the project panels, the map and Quick View all rebuild from this file.

  Fields per project:
    id        unique, lowercase-with-dashes; names the photo folder and the deep link (#id)
    category  which district it sits in. A new category makes a new district on the board.
    zone      short name shown on the board (keep it under about 16 characters)
    title, org, date, team, summary, headline (one short result line)
    tools     tool chips
    story     problem: text (a blank line, \n\n, starts a new paragraph)
              steps:   [{ did: "...", why: "..." }, ...]  ("What I did and why")
              result:  ["...", "..."]
  Optional:
    sprite  building art: "gpu", "fpga", "globe", "gearmotor", "door", "garage", "motor",
            "speaker", "planter", "oscilloscope", "zplane", "pylon", "camera", "gallery", "houses",
            plus older ones such as "shield", "cpu", "rocket", "dome". Anything else draws a plain chip.
    demo    mini-game from js/demos.js (see the list at the top of that file)
    photos  file names inside assets/projects/<id>/
    links   [{ label: "Code", url: "https://..." }]
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
      { group: "EDA & simulation", items: "Intel Quartus Prime, Micro-Cap (SPICE), EAGLE, Altium, MATLAB, Simulink, AutoCAD, SolidWorks" },
      { group: "Machine learning", items: "PyTorch, TensorFlow/Keras, scikit-learn, Optuna; TCN, GRU, RNN; OpenCV" },
      { group: "Also", items: "CUDA C, Arduino, STM32, I2C, SPI, UART, Real-Time Systems, PLC Programming, Motor Control, Sensor Integration, Signal Processing, Git, Docker" }
    ],
    experience: [
      { role: "Avionics Lead Engineer", org: "Western Engineering Rocketry Team, London", dates: "Sept 2023 – Present",
        line: "Leads an 8-person avionics sub-team. Wrote 100 Hz Kalman-filter firmware that drives the air brakes: Flight 2 overshot the 3,048 m target by 1.8%, against 6.5% on Flight 1 (72% less error)." },
      { role: "Field Engineering Intern", org: "EllisDon & PCL, Parliament of Canada, Ottawa", dates: "Sept 2024 – Sept 2026",
        line: "Checked installed work against electrical drawings, logging about 150 deficiencies a month, and cut median close-out time from 14 to 9 days. Automated the weekly RFI report with Python, saving 78 hours a year." },
      { role: "Sustainability Commissioner", org: "Undergraduate Engineering Society, London", dates: "May 2026 – Present",
        line: "Organized a PEO licensure (EIT to P.Eng.) info session for 40 students and plans professional-development and wellness programming." },
      { role: "Residence Don (Upper-Year)", org: "Western University Housing, London", dates: "Aug 2026 – Present",
        line: "Leads a residence community of 85 upper-year students across 3 floors and 21 suites." },
      { role: "Residence Education Advisor", org: "Western University Housing, London", dates: "Aug 2025 – May 2026",
        line: "Designed and ran 10+ academic and leadership programs for a 350-resident building." },
      { role: "Donor Relations & Events Planning Coordinator", org: "Canadian Blood Services, London", dates: "Apr 2024 – Sept 2024",
        line: "Planned 100+ community recruitment events and registered 500+ new donors, improving registration rates by 70%." }
    ]
  },

  projects: [
    /* ---------------- Digital, GPU and software ---------------- */
    {
      id: "cuda-matmul",
      category: "Digital, GPU and software",
      zone: "GPU Foundry",
      title: "Shape-Adaptive Batched Matrix Multiplication",
      org: "Western University",
      date: "Apr 2026",
      summary: "I built a CUDA engine that multiplies 12,200 independent matrix pairs of mixed shapes in one kernel launch. It runs 53× faster than per-matrix launches on the small-matrix workload.",
      headline: "53× faster on the small-matrix workload",
      tools: ["CUDA C", "Nsight Systems", "CUDA events", "cuBLAS (benchmark)"],
      story: {
        problem: "The task was to compute Cᵢ = Aᵢ·Bᵢ for thousands of independent matrix pairs across three workloads with very different shapes: thousands of tiny matrices, a smaller set of large ones up to 500×500 · 500×400, and a mix in between. The reference CUDA solution we were given handled only 1 of the 3 workloads.\n\nThe shapes pull in opposite directions. Tiny matrices finish so fast that launch overhead dominates. Large ones need careful tiling to reuse data. Matrices with a long inner dimension leave too few output tiles to keep the GPU busy. One kernel cannot be efficient at all three.",
        steps: [
          { did: "Diagnosed the reference solution before writing new code.", why: "I needed to know whether it failed because of a bug or a design limit. It was a design limit: it was built around one fixed tile setup, so shapes outside that assumption were not handled." },
          { did: "Wrote 3 specialized kernels and a dispatcher that picks one by matrix shape. Register-blocked 64×64 tiling handles large matrices. Whole-matrix shared memory handles small ones. Split-K with warp-shuffle reduction handles long inner dimensions.", why: "Each shape hits a different hardware limit, so each gets the kernel built for that limit." },
          { did: "Replaced 10,000 per-matrix launches with 1 batched launch.", why: "For small matrices the multiply itself takes microseconds, so launching a kernel per matrix spent most of the time on overhead." },
          { did: "Used roofline analysis (1.8 to 77 FLOP/byte across workloads) to set each kernel's target.", why: "It shows whether a workload is limited by compute or memory. That told me to benchmark compute-bound kernels against cuBLAS and memory-bound ones against peak bandwidth." },
          { did: "Checked every result against a double-precision CPU reference.", why: "Split-K changes the order floating-point sums are added, so I needed a trusted reference and a clear error tolerance." },
          { did: "Profiled the full pipeline with CUDA events and Nsight Systems, not just the kernels.", why: "Kernel-only timings overstate real speedups if data transfer is the hidden cost." }
        ],
        result: [
          "Handled all 3 workloads (12,200 matrices) where the reference handled 1, with a worst-case relative error under 5 × 10⁻⁶.",
          "Cut GPU time on the small-matrix workload from 41.6 ms to 0.78 ms (53× faster).",
          "Reached 52% of cuBLAS throughput on the compute-bound workload and 72% of peak memory bandwidth on the memory-bound ones.",
          "Showed that CPU–GPU copies made up 70–95% of total run time after optimization, making the PCIe bus the remaining bottleneck. The next step would be overlapping transfers with compute using CUDA streams."
        ]
      },
      sprite: "gpu",
      demo: "dispatch",
      photos: [],
      links: []
    },
    {
      id: "fpga-logic",
      category: "Digital, GPU and software",
      zone: "Logic Fortress",
      title: "Digital Logic Design in Verilog (FPGA)",
      org: "Western University",
      date: "Dec 2025",
      summary: "I built a 12-module FPGA control system that met its 50 MHz clock with a 140 MHz Fmax at under 2% logic utilization. On the board it matched simulation in all 6 operating states.",
      headline: "140 MHz Fmax against a 50 MHz clock; 100% of 250+ tests pass",
      tools: ["Verilog", "TCL", "Intel Quartus Prime Lite", "ModelSim", "FPGA development board"],
      story: {
        problem: "The project called for a multi-state controller on an FPGA board, driven by slide switches and push-buttons and shown on LEDs and 7-segment displays. It had to meet the board's 50 MHz clock and behave the same on hardware as in simulation.\n\nThree things made that hard. Bugs found on the board are slow to trace, because you can only see LEDs. Each compile-and-program cycle in the Quartus GUI took several manual steps, including 34 pin assignments that are easy to mistype. And real switches and buttons do not behave like the clean signals in a testbench.",
        steps: [
          { did: "Split the design into 12 RTL modules around a 6-state finite state machine, with reusable counters, registers, adders and multiplexers.", why: "Keeping control logic (the FSM) separate from the datapath let me test each piece on its own and find a bug's source quickly. Short logic paths between registers also gave timing headroom." },
          { did: "Wrote self-checking Verilog testbenches with 250+ test vectors covering every FSM state and transition, and debugged with ModelSim waveforms.", why: "A bug costs minutes to find in simulation and hours on hardware. Self-checking tests also flagged any regression as soon as I changed a module." },
          { did: "Wrote TCL scripts that automated pin mapping and the full Quartus compile flow.", why: "I expected 40+ compile-and-program cycles. Scripting them removed repetitive clicking, and a scripted pin map cannot be mistyped, so wiring errors would never be mistaken for logic bugs." },
          { did: "Tested every operating state on the board, then added debounce logic and 2-flop synchronizers.", why: "Mechanical switches bounce, and buttons change state without regard to the clock. Without conditioning, one press can register several times, or an input can catch a flip-flop mid-transition (metastability)." }
        ],
        result: [
          "Reached a 140 MHz Fmax against the 50 MHz requirement (2.8× headroom) at under 2% logic utilization.",
          "Fixed 9 logic and timing bugs before synthesis and reached a 100% pass rate on 250+ test vectors.",
          "Turned 40+ compile-and-program cycles into one command each and eliminated manual entry of 34 pin assignments.",
          "Found 0 differences between hardware and simulation across all 6 states, after fixing the 2 hardware-only faults (switch bounce and unsynchronized inputs)."
        ]
      },
      sprite: "fpga",
      demo: "debounce",
      photos: [],
      links: []
    },
    {
      id: "travel-assistant",
      category: "Digital, GPU and software",
      zone: "Travel Desk",
      title: "REST API Travel Assistant App",
      org: "Western University",
      date: "Sep 2025",
      team: "Team of 5; I built the API request and data-parsing layer",
      summary: "Our team built a Python app that turns flights, hotels, attractions and restaurants into one itinerary within the user's budget. In testing with 12 students it cut trip planning from about 45 minutes to under 3 minutes.",
      headline: "Trip planning ~45 min → under 3 min",
      tools: ["Python", "6 REST APIs", "JSON", "GitHub"],
      story: {
        problem: "Planning even a short trip meant hopping between separate sites for flights, hotels, things to do and places to eat, then adding it all up by hand to see if it fit the budget. Students we talked to spent about 45 minutes doing this for a single trip.\n\nPulling it into one app raised engineering problems. Six different APIs return data in six different formats. Live calls can be slow, time out or come back with fields missing, and an app that freezes or crashes on bad data is worse than the websites it replaces.",
        steps: [
          { did: "Connected 6 REST APIs for live flight, hotel, attraction and restaurant data, and cached repeated requests.", why: "Live data keeps prices and availability current. Caching means a repeated or slightly changed search does not wait on the network or burn through API rate limits again." },
          { did: "Wrote request and JSON-parsing functions that turn raw API responses into structured Python dictionaries (airline, airports, price), with handling for timeouts and missing fields.", why: "One clean, consistent format is what makes sorting and budgeting possible across sources. Handling failures gracefully keeps one bad response from breaking the whole search." },
          { did: "Ran 2 rounds of user feedback, tracked every issue in GitHub and merged fixes through reviewed pull requests with the design and data teammates.", why: "With 5 people in one codebase, code review stops one person's fix from breaking another's feature. Logging feedback as issues made sure nothing users reported was lost." }
        ],
        result: [
          "Cut trip planning time from about 45 minutes to under 3 minutes in testing with 12 students.",
          "Returned full trip results in under 4 seconds on average across 50 timed searches.",
          "Let users sort 60+ flight options per search by price, duration and stops.",
          "Fixed 25+ bugs and usability issues through 40+ reviewed pull requests."
        ]
      },
      sprite: "globe",
      demo: "trip",
      photos: [],
      links: []
    },

    /* ---------------- Embedded systems and motors ---------------- */
    {
      id: "dc-motor-pid",
      category: "Embedded systems and motors",
      zone: "PID Station",
      title: "Closed-Loop DC Motor Position Controller",
      org: "Personal project",
      date: "Jul 2026",
      summary: "I built a PID position controller for a DC gearmotor that cut overshoot on 90° steps from 22% to 3%. It holds position to within one encoder count (0.19°).",
      headline: "Overshoot 22% → 3%; holds position to 0.19°",
      tools: ["STM32", "C", "MATLAB", "Simulink", "Python", "H-bridge driver", "Quadrature encoder"],
      story: {
        problem: "In Control Systems coursework I tuned PID loops on paper and in Simulink. I wanted to see how those designs hold up on a real motor, with friction, a PWM output that saturates and an encoder that measures in steps.\n\nThe goal was to make a 12 V, 30:1 gearmotor move to a commanded angle quickly, without overshoot, and stop exactly there. Proportional-only control could not do both: raising the gain for speed caused overshoot, and lowering it left a steady-state error of more than 2°.",
        steps: [
          { did: "Built the hardware around an STM32 microcontroller, an H-bridge driving 20 kHz PWM, and a quadrature encoder with 1,920 counts per revolution.", why: "20 kHz is above the range of hearing, so the motor runs without whine, and fast enough to give smooth current. The encoder's 0.19° resolution sets the best accuracy the loop can reach." },
          { did: "Ran open-loop step tests and fit a first-order motor model in MATLAB.", why: "Tuning by trial and error on hardware is slow and can slam the gearbox. A model let me design the gains first and test them on hardware once." },
          { did: "Tuned the PID gains in Simulink for a 70° phase margin.", why: "A large phase margin keeps overshoot low and leaves room for what a first-order model misses, such as friction and gear backlash." },
          { did: "Wrote a discrete PID controller in C running at 1 kHz.", why: "A 1 ms update is about 45 times faster than the motor's 45 ms time constant, so the digital loop behaves like the continuous design." },
          { did: "Added integrator-clamping anti-windup and a 50 Hz filter on the derivative term.", why: "On long moves the PWM saturates and the integrator keeps growing, which causes overshoot when the motor arrives. The derivative term also magnifies encoder steps into noise, which showed up as PWM chatter at rest." },
          { did: "Wrote a Python tool to log and plot the board's serial data.", why: "I wanted numbers averaged over 20 trials, not judgments from watching the shaft." }
        ],
        result: [
          "Fit the motor model with a 93% match to measured data, giving a 45 ms time constant.",
          "On 90° steps, compared with proportional-only control: overshoot fell from 22% to 3% and steady-state error from 2.4° to 0.19° (one encoder count), with a 0.25 s settling time averaged over 20 trials.",
          "On 360° moves, anti-windup cut overshoot from 18% to 4%.",
          "The derivative filter reduced PWM chatter at rest from ±8% to ±2%."
        ]
      },
      sprite: "gearmotor",
      demo: "pid",
      photos: [],
      links: []
    },
    {
      id: "rfid-lock",
      category: "Embedded systems and motors",
      zone: "Access Gate",
      title: "RFID Door Lock & Lighting Control System",
      org: "Western University",
      date: "Apr 2026",
      team: "Team of 4",
      summary: "Our team designed an RFID door-access system that accepted all 8 approved card IDs and rejected all 1,016 others in an exhaustive test. It also ran 10,000 consecutive scans with no faults.",
      headline: "All 1,024 card IDs handled correctly",
      tools: ["C", "DE10-Standard (ARM Cortex-A9)", "MFRC522 RFID reader (SPI)", "STM32L476"],
      story: {
        problem: "We had to design a system that unlocks a door and switches on the room lights only for approved cards, and take it through all 10 design stages, from requirements to a live demo.\n\nThe catch was timing. The RFID reader and relays would not arrive until late in the term, but the firmware had to be written and proven well before then. An access system also has no room for \"mostly works\": a single wrong acceptance is a security failure.",
        steps: [
          { did: "Specified the inputs and outputs for all 6 devices: a 13.56 MHz MFRC522 reader over SPI, a manual-override button, door-strike and lighting relays, and red/green status LEDs.", why: "With the interfaces pinned down early, four people could work in parallel without their pieces drifting apart." },
          { did: "Wrote the C firmware as 4 modules (RFID interface, authentication, lock/light control, user feedback) in a polled loop.", why: "Separate modules meant I could swap the RFID interface for a test stand-in without touching the authentication logic. A polled loop is simple, predictable and fast enough for one reader and human-speed card taps." },
          { did: "Made the door unlock for 3 seconds, then relock automatically.", why: "Locked is the safe default. The door should never stay open because someone forgot to close it." },
          { did: "Ran the firmware on a DE10-Standard (ARM Cortex-A9) board before the real hardware existed. Its 10 slide switches stood in for card reads, and its LEDs stood in for the relays.", why: "This let us debug the logic weeks early. Ten switches also give exactly 2¹⁰ = 1,024 IDs, small enough to test every one." },
          { did: "Tested all 1,024 IDs, then ran 10,000 scans in a row.", why: "The exhaustive test proves there are no false accepts or false rejects. The long run checks for slow failures, such as a stuck state or a lockup." },
          { did: "Chose the STM32L476 (32-bit, 80 MHz) over the ATmega328P (8-bit, 20 MHz) for the final design.", why: "It shares the prototype's ARM architecture, which makes porting easier. Its 1 MB of flash leaves room to log entries later, and its low-power modes allow battery backup during power outages." }
        ],
        result: [
          "Accepted all 8 approved IDs and rejected all 1,016 others with no errors.",
          "Completed 10,000 consecutive scans with no faults.",
          "Delivered all 10 design stages, from requirements through a working live demo.",
          "Documented a final microcontroller choice that supports entry logging and battery backup as future features."
        ]
      },
      sprite: "door",
      demo: "rfid",
      photos: [],
      links: []
    },
    {
      id: "autonomous-robot",
      category: "Embedded systems and motors",
      zone: "Robot Garage",
      title: "Autonomous Driving Vehicle (Embedded Systems & Computer Vision)",
      org: "Western University",
      date: "Jan 2026",
      summary: "I developed an autonomous robot that stayed in its lane on 90% of test laps with zero collisions. It sorted 24 of 24 objects correctly and finished in 4:10 against a 6:00 limit.",
      headline: "24 of 24 objects sorted in 4:10 against a 6:00 limit",
      tools: ["Embedded C++", "IR line sensors", "Ultrasonic sensor", "SolidWorks", "3D printing", "Buck regulator", "Dual H-bridge"],
      story: {
        problem: "The robot had to drive a marked course on its own, avoid obstacles, find objects, pick them up, sort each as valuable or non-valuable and bring them home, all within 6 minutes.\n\nEarly test runs exposed two problems beyond the software. The gripper picked up an object only about 60% of the time, and every miss cost a retry and precious seconds. Worse, the microcontroller reset about 3 times per run whenever the drive motors stalled, wiping the robot's progress mid-mission.",
        steps: [
          { did: "Wrote embedded C++ that fused IR line-sensor and ultrasonic readings at 20 Hz into a closed-loop PID steering controller, with a 15 cm obstacle-avoidance trigger.", why: "Simple on/off line following zig-zags and drifts out of lane on curves. PID steers in proportion to the error, so corrections are smooth. A 15 cm trigger left enough room to stop or steer around an obstacle at driving speed." },
          { did: "Built the mission as a state machine in C++ with states for search, retrieval, homing and classification.", why: "The mission is a sequence of distinct behaviours. Explicit states make each transition predictable and let me trace any failure to the one state where it happened." },
          { did: "Redesigned the servo-driven claw and its mounts in SolidWorks over 3 3D-printed prototypes.", why: "Failed pickups were the biggest drag on our time. Most misses came from objects slipping or being pushed out of the jaws, so each prototype changed the jaw shape and mounting to grip more securely." },
          { did: "Designed a power-distribution subsystem that separated the 5 V logic rail from the 7.4 V motor rail, using a buck regulator, a dual H-bridge driver, flyback diodes and a 3 A fuse.", why: "Stalled motors drew enough current to drag the shared supply below the microcontroller's brownout threshold. Separate rails isolate the logic, flyback diodes absorb voltage spikes from the motors, and the fuse protects the battery and wiring during a stall." }
        ],
        result: [
          "Stayed within lane boundaries on 18 of 20 test laps (90%) with zero collisions.",
          "Sorted 24 of 24 objects correctly (100%) across 3 full runs, finishing in 4:10 against the 6:00 limit.",
          "Raised gripper pickup success from about 60% to 92% (23 of 25 attempts).",
          "Eliminated brownout resets during motor stalls, from about 3 per run to 0."
        ]
      },
      sprite: "garage",
      demo: "steer",
      photos: [],
      links: []
    },
    {
      id: "bldc-motor",
      category: "Embedded systems and motors",
      zone: "Motor Works",
      title: "Custom BLDC Motor",
      org: "Western University",
      date: "Dec 2025",
      summary: "I designed and built a 12-slot/14-pole brushless DC motor from first principles. It reached 3,000 RPM no-load and 63% efficiency within a 15 V, 5 A, 75 W limit.",
      headline: "Kv within 6% of design; cogging torque −40%",
      tools: ["SolidWorks", "3D printing", "14 N52 magnets", "24 AWG magnet wire", "Back-EMF and torque-arm testing"],
      story: {
        problem: "The challenge was to design a working BLDC motor from scratch, with the stator, rotor and windings sized by calculation, and a structure made from 3D-printed parts. It had to stay within a 15 V, 5 A, 75 W supply.\n\nThree things could sink it. The winding design had to land the speed constant (Kv) where the calculations said, or the motor would be too slow or draw too much current. 3D printers do not print to exact dimensions, yet the rotor–stator air gap had to hold at 0.8 mm. And the first build had noticeable cogging, a notchy torque ripple that made low-speed startup jerky.",
        steps: [
          { did: "Chose a 12-slot/14-pole layout.", why: "This combination has a high winding factor, so most of the copper contributes torque. Its slot and pole counts also share few common factors, which naturally keeps cogging low." },
          { did: "Wound 35 turns of 24 AWG per tooth in a Wye configuration.", why: "The number of turns sets Kv, so I calculated it to hit the target speed at 15 V. Wye gives more back-EMF per RPM than Delta, so the motor makes its torque with less current, keeping full load well under the 5 A limit." },
          { did: "Modelled the housing, rotor bell and bearing seats in SolidWorks as a 6-part assembly, and refined press-fit clearances (+0.2 mm) over 3 print iterations.", why: "Too wide a gap weakens the magnetic field, and too narrow a gap lets the rotor rub. Printed parts come out slightly off size, so the clearances had to be tuned by test prints, not just set in CAD." },
          { did: "Redesigned the magnet holder to space the 14 N52 magnets at a 0.8 pole-arc ratio.", why: "Cogging comes from magnet edges lining up with the gaps between stator teeth. Narrowing each magnet's arc relative to its pole spacing smooths that interaction." },
          { did: "Verified the design with a back-EMF test and a 100 mm torque arm on a digital scale.", why: "These are cheap, repeatable ways to check Kv and torque directly against the calculations." }
        ],
        result: [
          "Reached 3,000 RPM no-load and 63% efficiency at 0.12 N·m and 2,300 RPM (29 W out from 46 W in).",
          "Measured Kv at 215 RPM/V against a calculated 228 RPM/V, within 6%.",
          "Kept full-load current at 3.1 A, under the 5 A limit.",
          "Held the 0.8 mm air gap across the 6-part printed assembly.",
          "Cut cogging torque by 40% (12 → 7 mN·m), giving smoother low-speed startup."
        ]
      },
      sprite: "motor",
      demo: "turns",
      photos: [],
      links: []
    },

    /* ---------------- Analog, PCB and signal processing ---------------- */
    {
      id: "bjt-amplifier",
      category: "Analog, PCB and signal processing",
      zone: "Amp Stage",
      title: "Discrete BJT Audio Amplifier Design & Characterization",
      org: "Western University",
      date: "Sep 2026",
      summary: "I designed, simulated and bench-tested 6 discrete BJT amplifier circuits, from single gain stages to a speaker output stage. The Class AB output stage delivered about 0.85 W RMS into 8.2 Ω, 1.7× the 500 mW spec.",
      headline: "0.85 W RMS output, 1.7× the spec",
      tools: ["Altium (simulation)", "2N3904", "2N2222", "MJE800/MJE700 Darlingtons", "Oscilloscope", "Function generator", "DMM"],
      story: {
        problem: "The goal was a speaker amplifier built from individual transistors, with a 500 mW output spec and response down to 20 Hz. Each stage had to be designed by hand, simulated and then proven on the bench.\n\nSeveral classic problems stood in the way. A single gain stage loses almost all its gain when driving a low-impedance speaker. A simple Class B output stage distorts small signals where it hands off between transistors. And real transistors vary, so the design had to work with whatever parts came out of the bin.",
        steps: [
          { did: "Set every bias point by hand analysis first, then simulated in Altium, then measured on the bench.", why: "Hand analysis shows why a circuit works and gives an independent check on the simulator. When the bench disagreed, I could tell which assumption had failed." },
          { did: "Biased a 2N3904 common-emitter stage at 5 mA / 5 V for about 40 dB of midband gain, then added an emitter-follower buffer.", why: "I measured the gain dropping about 38 dB into an 8 Ω speaker, because the stage's output resistance is far higher than the load. An emitter follower has high input and very low output resistance, so it passes the signal on almost unchanged." },
          { did: "Built a ±6 V Class AB push-pull output stage with MJE800/MJE700 Darlingtons and a 3-diode bias network at 5 mA.", why: "The Class B version had a ±1.3 V dead zone around zero, the two base-emitter drops of each Darlington. Diode biasing holds the transistors just at the edge of conduction, removing most of that gap while keeping efficiency far above Class A." },
          { did: "Traced the bass roll-off to the output coupling capacitor and calculated the fix.", why: "The 470 µF capacitor and 8.2 Ω load form a high-pass filter with a cutoff near 40 Hz, matching the measured −3 dB point. Meeting the 20 Hz spec needs about 1,000 µF." },
          { did: "Designed a ±10 V differential amplifier with a current-source tail (I_EE = 4 mA).", why: "A current source holds the tail current steady when both inputs move together, which gives far better rejection of common-mode noise than a simple tail resistor." },
          { did: "Built a shunt-shunt feedback transresistance amplifier to test feedback theory against measurements.", why: "I wanted to measure, not just assume, what negative feedback buys: stable gain, lower output resistance and wider bandwidth." }
        ],
        result: [
          "Measured Q-points landed within 10–15% of target across all 6 circuits.",
          "The emitter-follower buffer measured Av ≈ 0.99, Rin ≈ 9 kΩ and Rout ≈ 5 Ω.",
          "The Class AB stage delivered about 0.85 W RMS into 8.2 Ω (1.7× the 500 mW spec) at about 48% efficiency, and largely removed the crossover dead zone.",
          "The differential amplifier gave about 26 dB single-ended gain, about 170 kHz bandwidth and about 79 dB CMRR at 1 kHz, with complementary 0°/180° outputs verified from 50 Hz to 1 MHz.",
          "With a loop factor (1 + Aβ) ≈ 8, closed-loop gain matched theory within 1%. Output resistance fell from 2.9 kΩ to 365 Ω, bandwidth grew about 8× (194 kHz → 1.5 MHz), and gain held within 1% when swapping a 2N3904 for a 2N2222."
        ]
      },
      sprite: "speaker",
      demo: "crossover",
      photos: [],
      links: []
    },
    {
      id: "pcb-shield",
      category: "Analog, PCB and signal processing",
      zone: "Plant Station",
      title: "PCB Design: Arduino UNO Sensor & Actuator Shield",
      org: "Western University",
      date: "Jan 2026",
      summary: "I designed a single-layer Arduino UNO shield for an automated plant-care station that connects 11 peripherals and passed DRC with zero violations. It drives a 12 V/2 A solenoid valve on the same board as the 5 V logic with zero Arduino resets.",
      headline: "0 resets across 50 solenoid actuations",
      tools: ["Altium Designer", "C++", "Arduino UNO", "ESP32", "Optocoupled relay"],
      story: {
        problem: "The shield had to monitor soil moisture, temperature and humidity, water level, light and tilt, and open a 12 V solenoid valve to water the plant. Everything had to fit within the standard 68.6 × 53.3 mm UNO footprint on a single copper layer, which is cheaper and faster to fabricate.\n\nThe hardest part was power. A 12 V/2 A solenoid draws a heavy surge when it switches and kicks back a voltage spike when it turns off. On a board shared with 5 V logic, that is a recipe for random microcontroller resets. The readings also had to reach a web dashboard, which the UNO cannot serve on its own.",
        steps: [
          { did: "Laid out the board on one layer in Altium, with 45° traces, a 12 V rail widened to 40 mil and 3 jumper bridges to close the ground net.", why: "A 40 mil trace carries 2 A with little heating. Three jumpers solved the few crossings a single layer cannot route, at far lower cost than moving to a two-layer board." },
          { did: "Isolated the solenoid behind an optocoupled relay on an external DC rail, and stepped sensor voltages down with resistive dividers.", why: "The optocoupler means the solenoid's current and voltage spikes never touch the Arduino's supply or pins. The dividers keep each sensor's output within the safe input range of the pin reading it." },
          { did: "Brought up the 45-component through-hole board methodically, checking each fault with continuity tests against the schematic.", why: "Powering up a board with a short can destroy parts. Testing every suspect net against the schematic found faults without guesswork." },
          { did: "Wrote C++ firmware that polls 5 sensors and streams the readings to an ESP32 web server every 2 s over 9600-baud UART.", why: "The ESP32 adds Wi-Fi the UNO lacks, and UART is the simplest link between them. A 2 s update suits slow-changing plant conditions and respects the DHT11's roughly once-per-second sampling limit." }
        ],
        result: [
          "Fit all 11 peripherals within the 68.6 × 53.3 mm UNO footprint on one layer, with zero DRC violations.",
          "Ran the 12 V/2 A solenoid with zero Arduino resets across 50 back-to-back actuations.",
          "Took the board from first power-on to fully working, fixing 2 power-rail shorts and 3 open traces.",
          "Streamed live readings from 5 sensors (capacitive moisture, DHT11, HC-SR04, LDR, tilt) to the ESP32 web server every 2 s."
        ]
      },
      sprite: "planter",
      demo: "plant",
      photos: [],
      links: []
    },
    {
      id: "function-generator",
      category: "Analog, PCB and signal processing",
      zone: "Signal Lab",
      title: "Function Generator: PCB Design & Circuit Simulation",
      org: "Western University",
      date: "Jan 2025",
      summary: "I designed and built a function generator with sine, square and triangle outputs from 10 Hz to 10 kHz. It worked on the first fabrication run with no layout revisions.",
      headline: "Worked on the first fabrication run; sine THD under 3%",
      tools: ["EAGLE", "Micro-Cap (SPICE)", "Op-amps", "Oscilloscope (FFT)", "Multimeter"],
      story: {
        problem: "The brief was a bench function generator covering three decades of frequency with three waveforms, built on a custom PCB. Board fabrication takes weeks, and a respin costs both time and money, so the design had to be right before it was sent out.\n\nThe waveform quality also mattered. A sine wave made by shaping a triangle is only an approximation, and a square wave's duty cycle drifts if the oscillator is not symmetric.",
        steps: [
          { did: "Built an op-amp relaxation oscillator feeding an integrator, with a diode wave-shaping network for the sine, across 3 switchable ranges.", why: "One oscillator produces the square wave, the integrator turns it into a triangle, and the shaper rounds that into a sine. All three outputs then track the same frequency. Switching ranges covers three decades without an impractically wide tuning control." },
          { did: "Checked the design with hand calculations and Micro-Cap transient simulations at 6 test frequencies before fabrication.", why: "Two independent predictions catch mistakes that either one alone would miss, and catching them on screen is far cheaper than in copper." },
          { did: "Laid out a 2-layer PCB in EAGLE.", why: "The second layer made room for clean routing and a solid ground return, which keeps noise off the analog signals." },
          { did: "Assembled and soldered about 35 components and debugged bring-up with an oscilloscope and multimeter.", why: "Checking supply rails first, then each stage in signal order, isolates any fault to one block." },
          { did: "Tuned the diode wave-shaping network while measuring distortion with the oscilloscope's FFT.", why: "How closely the shaped triangle resembles a sine depends on where the diodes start conducting. That is easiest to dial in by measurement rather than calculation alone." }
        ],
        result: [
          "Produced sine, square and triangle outputs from 10 Hz to 10 kHz across 3 switchable ranges.",
          "Predicted output frequency within ±5% of bench measurements at all 6 test points.",
          "Got a working board on the first fabrication run, with no layout revisions.",
          "Measured a sine output with under 3% THD and a square wave with a 50 ± 2% duty cycle."
        ]
      },
      sprite: "oscilloscope",
      demo: "waveforms",
      photos: [],
      links: []
    },
    {
      id: "iir-filter",
      category: "Analog, PCB and signal processing",
      zone: "Filter Lab",
      title: "Digital IIR Filter Design by Pole-Zero Placement",
      org: "Western University",
      date: "Apr 2026",
      summary: "I designed a band-pass and a notch filter at 120 Hz by placing poles and zeros by hand. The band-pass kept 96.3% of its energy within ±8 Hz of 120 Hz, against an 80% spec.",
      headline: "96.3% in-band energy against an 80% spec",
      tools: ["MATLAB"],
      story: {
        problem: "The signal was sampled at 340 Hz and carried a component at 120 Hz, the second harmonic of 60 Hz mains power and a common interference source. The task needed two opposite filters: a band-pass to isolate that component and a notch to remove it while leaving everything else untouched.\n\nThe constraint was to design both by placing poles and zeros directly, without MATLAB's filter-design tools. That forces a real understanding of how each pole and zero shapes the response. The project also covered what goes wrong when a signal is sampled too slowly.",
        steps: [
          { did: "Built the band-pass from 2 complex-conjugate pole pairs and 2 zeros, with a peak gain of 2.0.", why: "Poles placed close to the unit circle at the 120 Hz angle create a sharp peak there. Zeros at 0 Hz and at the Nyquist frequency pull down the response far from the band." },
          { did: "Built the notch from 4 zero pairs on the unit circle and 4 pole pairs just inside it at the band edges, then solved for the gain b₀.", why: "Zeros on the unit circle give true nulls spread across the ±8 Hz stopband. Poles just inside the circle bring the response back up quickly beyond the band, so the passband stays flat." },
          { did: "Wrote MATLAB code that calculated the frequency response directly from the poles and zeros and measured in-band energy with trapezoidal integration.", why: "It scored each candidate against the actual spec in seconds, instead of judging plots by eye. That made it practical to try 38 designs." },
          { did: "Checked both filters with test tones inside, near and far outside each band, and derived each filter's transfer function and difference equation.", why: "Tones prove the filters behave correctly on real signals. The difference equation is the form a microcontroller or DSP would actually run." },
          { did: "Demonstrated aliasing by sampling a 3-tone signal at 75% of its Nyquist rate, then compared reconstruction methods.", why: "It shows concretely what undersampling destroys and how sinc interpolation compares with zero-order hold, first-order hold and cubic-spline reconstruction." }
        ],
        result: [
          "The band-pass kept 96.3% of its energy within ±8 Hz of 120 Hz (spec: ≥80%) at a peak gain of 2.0. It passed 120 Hz at 2.0× gain and cut 100 Hz by 22 dB.",
          "The notch held gain below 0.023 across the ±8 Hz stopband and between 0.9 and 1.1 outside ±16 Hz.",
          "Tested 38 candidate designs quickly with the custom MATLAB evaluator.",
          "Rebuilt the Nyquist-rate samples with sinc interpolation to within 23% error."
        ]
      },
      sprite: "zplane",
      demo: "zplane",
      photos: [],
      links: []
    },

    /* ---------------- Machine learning ---------------- */
    {
      id: "load-forecast",
      category: "Machine learning",
      zone: "Grid Forecast",
      title: "Day-Ahead Electricity Load Forecasting",
      org: "Western University",
      date: "Nov 2026",
      team: "Team project; I owned model evaluation and test reporting",
      summary: "We built a pipeline that forecasts the next 24 hours of electricity demand for a distribution zone in Tetouan, Morocco, every hour. The tuned models beat the seasonal-naive baseline by 16–23% in RMSE, and the final model ships as a 139 kB TensorFlow Lite file.",
      headline: "16–23% lower RMSE than the seasonal-naive baseline",
      tools: ["Python", "TensorFlow/Keras", "scikit-learn", "TensorFlow Lite", "Git"],
      story: {
        problem: "Grid operators schedule generation a day ahead. Over-forecasting wastes reserve capacity, and under-forecasting risks shortfalls, so every kilowatt of error has a cost. We had 52K ten-minute power readings to learn from.\n\nTime-series forecasting has well-known traps. Shuffled splits and scalers fitted on all the data quietly leak the future into training and make models look better than they are. \"Same as yesterday\" is a surprisingly hard baseline to beat for electricity load. And with many architectures to compare, differences in tuning can masquerade as differences in models.",
        steps: [
          { did: "Used a time-ordered train/test split, fitted preprocessing on training data only, and validated with rolling-origin cross-validation.", why: "This guarantees no model ever sees information from the period it is predicting, so test scores reflect real forecasting skill." },
          { did: "Compared 6 neural architectures (MLP, CNN, SimpleRNN, LSTM, GRU, TCN) against linear and seasonal-naive baselines under one shared training protocol.", why: "The same data, budget and stopping rules for every model mean the differences come from architecture, not tuning luck. The baselines show whether deep learning earns its cost at all." },
          { did: "Added a residual \"anchor\" so the networks learn corrections to yesterday's load profile instead of predicting it from scratch.", why: "Load repeats strongly from day to day. Predicting only the change is an easier target and lets the networks spend their capacity on what actually differs." },
          { did: "Compared accuracy against training cost for 8 models and investigated where the errors came from.", why: "A single accuracy number hides when and why a model fails. Anyone relying on the forecast needs to know its blind spots." },
          { did: "Exported the final model to TensorFlow Lite and built checkpointing plus a smoke test that rebuilds forecasts from the raw data.", why: "A small model can run on modest hardware near the grid. Results that cannot be reproduced from scratch cannot be trusted." }
        ],
        result: [
          "The tuned models had 16–23% lower RMSE than the seasonal-naive baseline on the held-out test set.",
          "The residual anchor lowered validation error by 9–28% across the sequence models.",
          "Traced a consistent winter over-forecast to two causes: training data covered only January to August, and the inputs did not mark holidays. This points to the next fixes.",
          "The TensorFlow Lite model is 139 kB and stays within 2.3 kW of the full model.",
          "Retraining all 90 networks from scratch reproduced every result exactly."
        ]
      },
      sprite: "pylon",
      demo: "anchor",
      photos: [],
      links: []
    },
    {
      id: "transfer-learning",
      category: "Machine learning",
      zone: "Vision Lab",
      title: "Transfer Learning for Image Classification",
      org: "Western University",
      date: "Mar 2026",
      summary: "I compared a from-scratch CNN against 5 transfer-learning setups on CIFAR-10. My 6-layer CNN won at 88.5% test accuracy, and progressive unfreezing came within 0.8 points of it in under half the training time.",
      headline: "88.5% CIFAR-10 accuracy from a 6-layer CNN",
      tools: ["PyTorch", "ResNet-50", "CIFAR-10/100", "ImageNet and Places365 weights", "4 GB laptop GPU"],
      story: {
        problem: "The usual advice is to start from a pretrained model rather than train from scratch. But ResNet-50 learned its features on 224×224 ImageNet photos, while CIFAR-10 images are only 32×32. I wanted to test whether transfer learning still pays off when the images are that different, and which transfer strategy works best.\n\nTwo practical limits shaped the work. Differences between methods were likely to be under a point, so a single noisy run could crown the wrong winner. And everything had to run on a 4 GB laptop GPU.",
        steps: [
          { did: "Designed a 6-layer CNN with batch normalization and dropout as the from-scratch baseline.", why: "Transfer learning only proves its value against a strong baseline. Batch normalization keeps training stable, and dropout limits overfitting on CIFAR-10's 45K training images (50K minus the validation split)." },
          { did: "Fine-tuned an ImageNet-pretrained ResNet-50 two ways: training the head only, and progressively unfreezing deeper layers.", why: "This tests whether frozen ImageNet features work as-is on tiny images, or need to be adapted." },
          { did: "Tried a Places365-pretrained ResNet-50.", why: "Places365 is a scene dataset, so it tests whether the source domain matters, not just pretraining in general." },
          { did: "Compared direct transfer with a two-stage route (ImageNet → CIFAR-100 → CIFAR-10).", why: "CIFAR-100 matches CIFAR-10's image size and style, so it tests whether an intermediate step bridges the gap." },
          { did: "Locked down a fair, repeatable protocol: fixed seeds, 3 runs per setup reported as mean ± std, a 10% validation split for early stopping, and the same AdamW optimizer and stopping rules for every method.", why: "With differences this small, only repeated runs under identical rules can separate a real effect from noise." },
          { did: "Used mixed precision, channels-last memory and pinned-memory loading.", why: "These cut runtime and memory so ResNet-50 experiments fit on a 4 GB GPU." }
        ],
        result: [
          "The scratch CNN reached 88.5% test accuracy (±0.05 points over 3 seeds), the best of all 6 setups.",
          "Freezing the pretrained backbone failed on 32×32 images: head-only fine-tuning reached only 46.9%. Progressive unfreezing reached 87.8%, within 0.8 points of the scratch CNN in under half its training time (539 s vs. 1,146 s).",
          "Places365 weights reached 82.2%, 6.3 points below the scratch CNN, showing the source domain matters.",
          "The extra CIFAR-100 stage gained only 0.3 points over direct ImageNet transfer (87.0% vs. 86.7%), not enough to justify the added training."
        ]
      },
      sprite: "camera",
      demo: "transfer",
      photos: [],
      links: []
    },
    {
      id: "vae-dcgan",
      category: "Machine learning",
      zone: "Gen Gallery",
      title: "Generative Image Modeling: VAE vs. DCGAN",
      org: "Western University",
      date: "Feb 2026",
      summary: "I trained a convolutional VAE and a DCGAN on 28×28 clothing images under identical conditions. The DCGAN cut image-quality error (FID) by 51%, from 66.8 to 32.9, and covered all 10 clothing classes with no mode collapse.",
      headline: "FID cut 51% (66.8 → 32.9)",
      tools: ["Python", "PyTorch", "torchmetrics (FID, PSNR, SSIM)", "Matplotlib", "Fashion-MNIST"],
      story: {
        problem: "VAEs and GANs are the two classic ways to generate images, and their reputations are well known: VAEs are stable but blurry, while GANs are sharp but can be unstable or get stuck producing only a few kinds of output (mode collapse). I wanted to measure these trade-offs on the same data rather than rely on side-by-side impressions.\n\nThe hard part was choosing fair metrics. A single image-quality score can look good even if a model never generates some classes at all.",
        steps: [
          { did: "Built a convolutional VAE that compresses each 784-pixel image into a 32-number code.", why: "It tests how much of an image a compact code preserves, measured with PSNR and SSIM on reconstructions." },
          { did: "Trained both models for the same 9,380 steps on the same data split.", why: "An equal training budget means any gap in results comes from the model design." },
          { did: "Scored image quality with FID on 5,000 generated vs. 5,000 real images, and scored two sets of real images against each other as a floor.", why: "FID is the standard measure. The real-vs-real score of 5.1 shows the best value achievable at this sample size, which puts both models' numbers in context." },
          { did: "Trained my own CNN classifier (89.6% accurate) and used it to label 10,000 samples from each model.", why: "The class mix of generated samples shows directly whether a model covers every type of clothing or has collapsed onto a few. FID alone cannot show this." },
          { did: "Tracked discriminator loss through training.", why: "A GAN that is diverging usually shows it there first, so a steady loss is evidence of stable training." }
        ],
        result: [
          "The VAE compressed each image 24.5× and rebuilt images at 18.8 dB PSNR and 0.78 SSIM across all 10,000 validation images.",
          "The DCGAN cut FID from 66.8 to 32.9 (51% lower), against a best achievable of 5.1.",
          "The DCGAN covered all 10 classes at 7.3–12.0% each, close to the 10% in the real data. The VAE made only 3.0% sandals, because its blur smears thin straps into solid shoes.",
          "The GAN trained stably, with discriminator loss holding at 1.06–1.11 from epoch 5 to 20. It used 46% fewer parameters (0.91M vs. 1.70M) but took 3.4× longer to train."
        ]
      },
      sprite: "gallery",
      demo: "blur",
      photos: [],
      links: []
    },
    {
      id: "housing-forecast",
      category: "Machine learning",
      zone: "Permit Office",
      title: "Predictive Analysis of U.S. Housing Markets",
      org: "Western University",
      date: "Sep 2025",
      summary: "I built a deep learning pipeline that cut 12-month forecast error by 18% (RMSE) against a tuned SARIMA baseline, using 60+ years of monthly U.S. building-permit data.",
      headline: "18% lower RMSE than a tuned SARIMA",
      tools: ["Python", "Keras", "Keras Tuner", "Optuna", "T4 GPU", "U.S. Census building-permit data"],
      story: {
        problem: "Building permits are a leading indicator of housing supply: they show where construction is heading months before homes are built. A reliable 12-month forecast helps planners, builders and investors see that supply coming.\n\nSARIMA, the standard statistical model for seasonal series, is the benchmark to beat. But many regional series are sparse and swing sharply, which SARIMA handles poorly. Deep models can do better, but they are expensive to tune and easy to overrate with a single lucky test split.",
        steps: [
          { did: "Benchmarked RNN, GRU and Temporal Convolutional Network (TCN) models against a tuned SARIMA baseline.", why: "Tuning SARIMA properly keeps the comparison honest. The three deep models cover different ways of capturing long seasonal patterns, from recurrent memory to the TCN's dilated convolutions." },
          { did: "Ran 200+ Bayesian optimization trials with Keras Tuner and Optuna, using median pruning, on a T4 GPU.", why: "Bayesian search spends trials on promising settings instead of sampling blindly. Median pruning stops trials that are already behind the pack, so less GPU time is wasted on dead ends." },
          { did: "Picked the model by its error on the sparse, high-variance regional series.", why: "Those are the series where SARIMA struggles most and where a better forecast adds the most value." },
          { did: "Validated with walk-forward testing across 5 rolling windows instead of one train/test split.", why: "One split can land on an unusually calm or unusually volatile period. Walk-forward testing mimics how the model would actually be used, forecasting forward from each point in time." }
        ],
        result: [
          "Reduced 12-month forecast error by 18% (RMSE) against the tuned SARIMA baseline.",
          "Cut hyperparameter search time by about 40%.",
          "Selected a TCN, which had the lowest error on the sparse, high-variance regional series.",
          "Confirmed the gains held out-of-sample across 5 rolling test windows."
        ]
      },
      sprite: "houses",
      demo: "walkforward",
      photos: [],
      links: []
    }
  ]
};
