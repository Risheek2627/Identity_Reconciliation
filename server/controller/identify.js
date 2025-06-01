const pool = require("../config/db");

const identify = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({ error: "Provide email or phoneNumber." });
    }

    const [existingContacts] = await pool.query(
      "SELECT * FROM contacts WHERE (email=? OR phoneNumber=?) AND deletedAt IS NULL",
      [email, phoneNumber]
    );
    if (existingContacts.length === 0) {
      const [insertresult] = await pool.query(
        "INSERT INTO contacts (email,phoneNumber,linkPrecedence) VALUES (?,?,'primary')",
        [email, phoneNumber]
      );

      return res.json({
        contact: {
          primaryContatctId: insertresult.insertId,
          emails: [email],
          phoneNumbers: [phoneNumber],
          secondaryContactIds: [],
        },
      });
    }
    // if matches found , figure out primary
    const allContacts = [...existingContacts];
    const primaryContact = allContacts.filter(
      (c) => c.linkPrecedence === "primary"
    );

    console.log(primaryContact);

    let primary = primaryContact[0];

    console.log("Primary : ", primary);
    if (primaryContact.length > 1) {
      for (let pc of primaryContact) {
        if (new Date(pc.createdAt) < new Date(primary.createdAt)) {
          primary = pc;
        }
      }

      // update other primaries to secondaries
      const toUpdate = primaryContact.filter((c) => c.id !== primary.id);

      for (let p of toUpdate) {
        await pool.query(
          "UPDATE contacts SET linkPrecedence = 'secondary' , linkedId=? WHERE id=?",
          [primary.id, p.id]
        );
      }
    }

    if (!primary) {
      const secondary = allContacts.find(
        (c) => c.linkPrecedence === "secondary"
      );
      if (secondary && secondary.linkedId) {
        const [rows] = await pool.query(
          "SELECT * FROM contacts WHERE id=? AND deletedAt IS NULL",
          [secondary.linkedId]
        );
        if (rows.length > 0) {
          primary = rows[0];
        }
      }
    }

    console.log("All contacts found:", allContacts);

    // 6. Check if the exact email + phone combo already exists
    const alreadyExists = allContacts.some(
      (c) => c.email === email && c.phoneNumber === phoneNumber
    );

    // If not already present, insert as secondary linked to primary
    if (!alreadyExists) {
      await pool.query(
        "INSERT INTO contacts (email,phoneNumber,linkedId,linkPrecedence) VALUES (?,?,?,'secondary')",
        [email, phoneNumber, primary.id]
      );
    }

    const [finalContacts] = await pool.query(
      "SELECT * FROM contacts WHERE (id = ? OR linkedId =?) AND deletedAt IS NULL",
      [primary.id, primary.id]
    );

    const emails = [
      ...new Set(finalContacts.map((c) => c.email).filter(Boolean)),
    ];
    const phoneNumbers = [
      ...new Set(finalContacts.map((c) => c.phoneNumber).filter(Boolean)),
    ];
    const secondaryConIds = finalContacts
      .filter((c) => c.linkPrecedence === "secondary")
      .map((c) => c.id);

    return res.json({
      contact: {
        primaryContactId: primary.id,
        emails: emails,
        phone_Number: phoneNumbers,
        secondaryContactIds: secondaryConIds,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};

module.exports = identify;
