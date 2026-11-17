client.on('message', async (msg) => {
    const contact = await msg.getContact();

    const clearTaxPayload = {
        sessionId: 'employee_1',
        direction: msg.fromMe ? 'outgoing' : 'incoming',
        from: msg.from, 
        body: msg.body,
        type: msg.type,
        
        // --- ADD THESE FIELDS FOR CLEAN VISIBILITY ---
        senderPhone: contact.number,                // Clear numeric string (e.g., "917597708865")
        senderPushName: contact.pushname || 'User'  // Their public WhatsApp profile name
    };

    // Replace your saving/pushing logic with this payload
    saveToClearTax(clearTaxPayload);
});