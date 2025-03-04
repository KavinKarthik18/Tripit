import 'package:flutter/material.dart';
import 'package:jitsi_meet_flutter_sdk/jitsi_meet_flutter_sdk.dart';

class VoiceIntercomService {
  final JitsiMeet jitsiMeet = JitsiMeet();

  Future<void> joinVoiceChat(BuildContext context) async {
    try {
      final options = JitsiMeetConferenceOptions(
        serverURL: 'https://meet.jit.si', 
        room: 'Tripit',
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
