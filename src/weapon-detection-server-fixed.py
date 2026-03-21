"""
CRITICAL FIX: SSE Connection Issue
====================================
The SSE endpoint wasn't sending an initial message, so browser never fired 'onopen'.
This patch adds:
1. Initial comment to establish connection
2. Keepalive comments every 0.5s
3. Better logging

INSTRUCTIONS:
Replace the alerts_stream function in weapon-detection-server.py with this version.
"""

@app.route('/api/alerts/stream')
def alerts_stream():
    """
    SSE stream: emits a 'detection' event whenever a new detection is appended.
    Frontend example:
        const es = new EventSource('/api/alerts/stream');
        es.addEventListener('detection', (evt) => {
            const data = JSON.parse(evt.data);
            console.log('ALERT', data);
        });
    """
    def event_stream(last_seen_id=0):
        # Respect Last-Event-ID header for reconnections
        hdr_id = request.headers.get('Last-Event-ID')
        if hdr_id and hdr_id.isdigit():
            last_seen_id = int(hdr_id)

        # CRITICAL: Send initial comment to establish connection
        # This triggers the 'onopen' event in the browser
        yield ": SSE connection established\n\n"
        print(f"✅ SSE client connected from {request.remote_addr}")

        keepalive_counter = 0
        while True:
            # Pull any events with id > last_seen_id
            with detection_lock:
                new_events = [e for e in detection_events if e.get('id', 0) > last_seen_id]
            if new_events:
                for e in new_events:
                    payload = json.dumps(e)
                    # SSE formatted message
                    print(f"📤 SSE: Sending detection event {e['id']} to client")
                    yield f"id: {e['id']}\nevent: detection\ndata: {payload}\n\n"
                    last_seen_id = e['id']
            
            # Send keepalive comment every 30 iterations (~15 seconds)
            keepalive_counter += 1
            if keepalive_counter >= 30:
                yield ": keepalive\n\n"
                keepalive_counter = 0
            
            # Prevent tight loop; also keeps connection alive
            time.sleep(0.5)

    headers = {
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',  # for nginx: do not buffer
        'Connection': 'keep-alive'
    }
    return Response(event_stream(), mimetype='text/event-stream', headers=headers)
