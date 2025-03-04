import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:jitsi_meet_flutter_sdk/jitsi_meet_flutter_sdk.dart';

class OpenStreetMapPage extends StatelessWidget {
  final VoiceIntercomService voiceIntercomService = VoiceIntercomService();

  @override
  Widget build(BuildContext context) {
    // Define marker coordinates across Chennai randomly
    final markers = [
      LatLng(13.0827, 80.2707), // Marina Beach
      LatLng(13.0604, 80.2496), // Guindy National Park
      LatLng(13.0475, 80.2094), // Airport Area
      LatLng(13.1004, 80.2424), // Anna Nagar
      LatLng(13.1205, 80.2295), // Mogappair
      LatLng(13.0700, 80.2800), // T. Nagar
      LatLng(13.1350, 80.2200), // Ambattur
      LatLng(13.0820, 80.2870), // Royapettah
      LatLng(13.0350, 80.2440), // Velachery
      LatLng(13.0756, 80.1944), // Porur
      LatLng(13.1400, 80.1600), // Poonamallee
    ];

    return Scaffold(
      body: FlutterMap(
        options: MapOptions(
          center: LatLng(13.0827, 80.2707), // Centered on Chennai
          zoom: 12, // Adjusted zoom to cover wider area
        ),
        children: [
          TileLayer(
            urlTemplate: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            subdomains: ['a', 'b', 'c'],
          ),
          MarkerLayer(
            markers: markers.asMap().entries.map((entry) {
              final index = entry.key;
              final point = entry.value;
              final isElectricBike = index % 2 == 0;
              return Marker(
                point: point,
                width: 50,
                height: 50,
                builder: (ctx) => Icon(
                  isElectricBike ? Icons.electric_bike : Icons.directions_bike,
                  color: isElectricBike ? Colors.green[800] : Colors.black,
                  size: 30,
                ),
              );
            }).toList(),
          ),
        ],
      ),
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          FloatingActionButton(
            onPressed: () {
              showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  title: Text("SOS Alert"),
                  content: Text("SOS signal sent! Help is on the way."),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: Text("OK"),
                    ),
                  ],
                ),
              );
            },
            backgroundColor: Colors.black,
            child: Icon(Icons.sos, color: Colors.white),
          ),
          SizedBox(height: 16),
          FloatingActionButton(
            onPressed: () => voiceIntercomService.joinVoiceChat(context),
            backgroundColor: Colors.black,
            child: Icon(Icons.mic, color: Colors.white),
          ),
        ],
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
    );
  }
}

class VoiceIntercomService {
  final JitsiMeet jitsiMeet = JitsiMeet();

  Future<void> joinVoiceChat(BuildContext context) async {
    try {
      final options = JitsiMeetConferenceOptions(
        serverURL: 'https://meet.jit.si',
        room: 'Tripit-63791',
        userInfo: JitsiMeetUserInfo(displayName: 'User'),
        configOverrides: {
          'startWithVideoMuted': true,
          'startWithAudioMuted': false,
          'audioOnly': true,
        },
      );

      await jitsiMeet.join(options);
    } catch (error) {
      debugPrint("Error joining meeting: $error");
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to join the chat: $error')),
      );
    }
  }
}