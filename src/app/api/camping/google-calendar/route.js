import { google } from "googleapis";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.accessToken) {
      //   console.log('No session or access token found');
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { orderId, items, contactName, contactEmail } = body;

    // console.log("Received order data:", { orderId, items: items.length });

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: session.accessToken,
      refresh_token: session.refreshToken,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // console.log('Starting to create calendar events...');

    const eventPromises = items.map(async (item, index) => {
      const event = {
        summary: `露營預訂 - ${item.activity_name}`,
        location: item.spot_name,
        description: `訂單編號: ${orderId}\n營位: ${item.spot_name}\n聯絡人: ${contactName}\n電子郵件: ${contactEmail}`,
        start: {
          date: item.start_date.split("T")[0],
          timeZone: "Asia/Taipei",
        },
        end: {
          date: item.end_date.split("T")[0],
          timeZone: "Asia/Taipei",
        },
        reminders: {
          useDefault: true,
        },
      };

      try {
        const response = await calendar.events.insert({
          calendarId: "primary",
          resource: event,
        });
        // console.log(`Successfully created event ${index + 1}:`, response.data.htmlLink);
        return response;
      } catch (error) {
        // console.error(`Failed to create event ${index + 1}:`, error.message);
        return null;
      }
    });

    const results = await Promise.all(eventPromises);
    const successfulEvents = results.filter((r) => r !== null);

    // console.log(`Created ${successfulEvents.length} out of ${items.length} events`);

    return new Response(
      JSON.stringify({
        success: true,
        eventsCreated: successfulEvents.length,
        totalEvents: items.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Google Calendar API Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
