import 'dart:convert';
import 'package:flutter_web_auth/flutter_web_auth.dart';
import 'package:http/http.dart' as http;

class SpotifyAuth {
  final String clientId = 'dd9a1988017c403186cb3e622f64507b';
  final String clientSecret = 'e2c4a94521034ebd8e63fd9bf4d5c6a0';
  final String redirectUri = 'https://my-portfolio-hwmt.vercel.app';

  Future<String?> authenticate() async {
    final authUri = Uri.https('accounts.spotify.com', '/authorize', {
      'response_type': 'code',
      'client_id': clientId,
      'redirect_uri': redirectUri,
      'scope': 'user-read-private playlist-modify-public playlist-modify-private',
    });

    final result = await FlutterWebAuth.authenticate(
      url: authUri.toString(),
      callbackUrlScheme: 'myapp',
    );

    final code = Uri.parse(result).queryParameters['code'];
    return await _getAccessToken(code!);
  }

  Future<String?> _getAccessToken(String code) async {
    final response = await http.post(
      Uri.https('accounts.spotify.com', '/api/token'),
      headers: {
        'Authorization': 'Basic ${base64Encode(utf8.encode('$clientId:$clientSecret'))}',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': redirectUri,
      },
    );

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body);
      return json['access_token'];
    } else {
      print('Failed to get access token: ${response.body}');
      return null;
    }
  }
}