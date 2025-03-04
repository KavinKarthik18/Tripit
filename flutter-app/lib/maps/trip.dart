class Participant {
  final String id;
  final String name;
  final String role;
  bool reachedMeetingPoint;
  bool reachedDestination;

  Participant({
    required this.id,
    required this.name,
    required this.role,
    this.reachedMeetingPoint = false,
    this.reachedDestination = false,
  });
}

class Trip {
  final String name;
  final String destination;
  final List<Participant> participants;
  bool isSimulating;
  int simulationStep;

  Trip({
    required this.name,
    required this.destination,
    required this.participants,
    this.isSimulating = false,
    this.simulationStep = 0,
  });
}