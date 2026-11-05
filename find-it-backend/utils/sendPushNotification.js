const sendPushNotification = async (
  expoPushToken,
  title,
  body,
  data = {}
) => {
  try {
    if (!expoPushToken) {
      console.log('Expo Push Token tidak tersedia');
      return null;
    }

    const message = {
      to: expoPushToken,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      channelId: 'default',
    };

    const response = await fetch(
      'https://exp.host/--/api/v2/push/send',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      }
    );

    const result = await response.json();

    console.log('Hasil pengiriman push notification:', result);
    return result;
  } catch (error) {
    console.error('Gagal mengirim push notification:', error);
    return null;
  }
};

export default sendPushNotification;
