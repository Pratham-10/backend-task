const db = require('../database/userdata'); 

class JournalController {

    // Function to create a new journal
    static createJournal = (req, res) => {
        const { description, students_tagged, attachment_type, attachment_link, published_at } = req.body;
        const teacher_id = req.user.id;
        const userRole = req.user.role;

        //Checking the role as teacher only has access to create the journal
        if (userRole != 'teacher') {
            return res.status(403).json({ message: 'You are not authorized to create a journal' });
        }

        if (!description || !attachment_type || !published_at) {
            return res.status(400).json({ message: 'Invalid data' });
        }

        // Converting the students_tagged array to a JSON string before storing it in the database
        const studentsTaggedJSON = JSON.stringify(students_tagged);

        // Insert the new journal into the database
        const insertQuery =
            'INSERT INTO journals (description, students_tagged, attachment_type, attachment_link, published_at, teacher_id) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(
            insertQuery,
            [description, studentsTaggedJSON, attachment_type, attachment_link, published_at, teacher_id],
            (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Failed to create journal' });
                }

                res.json({ message: 'Journal created successfully', journalId: result.insertId });
            }
        );
    };

    // Function to update an existing journal
    static updateJournal = (req, res) => {
        const { description, students_tagged, attachment_type, attachment_link, published_at } = req.body;
        const journalId = req.params.id;
        const teacher_id = req.user.id;
        const userRole = req.user.role;

        //Checking the role as teacher only has access to update the journal
        if (userRole != 'teacher') {
            return res.status(403).json({ message: 'You are not authorized to update a journal' });
        }

        if (!description || !attachment_type || !published_at) {
            return res.status(400).json({ message: 'Invalid data' });
        }

        // Check if the journal exists and is owned by the teacher
        const selectQuery = 'SELECT * FROM journals WHERE id = ? AND teacher_id = ?';
        db.query(selectQuery, [journalId, teacher_id], (err, [rows]) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Internal server error' });
            }

            if (rows.length === 0) {
                return res.status(404).json({ message: 'Journal not found or not authorized' });
            }

            const studentsTaggedJSON = JSON.stringify(students_tagged);

            // Update the journal in the database
            const updateQuery =
                'UPDATE journals SET description = ?, students_tagged = ?, attachment_type = ?, attachment_link = ?, published_at = ? WHERE id = ?';
            db.query(
                updateQuery,
                [description, studentsTaggedJSON, attachment_type, attachment_link, published_at, journalId],
                (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ message: 'Failed to update journal' });
                    }

                    res.json({ message: 'Journal updated successfully' });
                }
            );
        });
    };

    // Function to delete a journal
    static deleteJournal = (req, res) => {
        const journalId = req.params.id;
        const teacher_id = req.user.id;
        const userRole = req.user.role;
    //Checking the role as teacher only has access to delete the journal
        if (userRole != 'teacher') {
            return res.status(403).json({ message: 'You are not authorized to delete a journal' });
        }

        // Check if the journal exists and is owned by the teacher
        const selectQuery = 'SELECT * FROM journals WHERE id = ? AND teacher_id = ?';
        db.query(selectQuery, [journalId, teacher_id], (err, [rows]) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Internal server error' });
            }

            if (rows.length === 0) {
                return res.status(404).json({ message: 'Journal not found or not authorized' });
            }

            // Delete the journal from the database
            const deleteQuery = 'DELETE FROM journals WHERE id = ?';
            db.query(deleteQuery, [journalId], (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Failed to delete journal' });
                }

                res.json({ message: 'Journal deleted successfully' });
            });
        });
    };

    // Function to publish a journal
    static publishJournal = (req, res) => {
        const journalId = req.params.id;
        const teacher_id = req.user.id;
        const userRole = req.user.role;

    //Checking the role as teacher only has access to publish the journal
        if (userRole != 'teacher') {
            return res.status(403).json({ message: 'You are not authorized to publish a journal' });
        }

        // Check if the journal exists and is owned by the teacher
        const selectQuery = 'SELECT * FROM journals WHERE id = ? AND teacher_id = ?';
        db.query(selectQuery, [journalId, teacher_id], (err, [rows]) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Internal server error' });
            }

            if (rows.length === 0) {
                return res.status(404).json({ message: 'Journal not found or not authorized' });
            }

            // Update the 'published_at' field with current time
            const publishQuery = 'UPDATE journals SET published_at = NOW() WHERE id = ?';
            db.query(publishQuery, [journalId], (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Failed to publish journal' });
                }

                res.json({ message: 'Journal published successfully' });
            });
        });
    };

    // Function to get the journal feed 
    static getJournalFeed = (req, res) => {
        const userId = req.user.id;
        const userRole = req.user.role;
    
    //Checking the role as teacher has access to all journals
        if (userRole === 'teacher') {
            const feedQuery = 'SELECT * FROM journals WHERE teacher_id = ?';
            const queryParams = [userId];

    // Getting the journal feed 
            db.query(feedQuery, queryParams, (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Internal server error' });
                }
                res.json({ feed: result });
            });
        }
        
    // Get all the journals where the student is tagged and that are already published
        else if (userRole === 'student') {
            const currentDateTimeUTC = new Date()
            const indianDateTime = new Date(currentDateTimeUTC.getTime() + (5.5 * 60 * 60 * 1000)).toISOString(); // Get the current date and time in ISO format
          
            const feedQuery = `
              SELECT * FROM journals
              WHERE JSON_SEARCH(students_tagged, 'all', ?) IS NOT NULL 
              AND published_at <= ?
              ORDER BY published_at DESC
              LIMIT 0, 1000`;
          
            const queryParams = [userId.toString(), indianDateTime];
          
            db.query(feedQuery, queryParams, (err, result) => {
              if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Internal server error' });
              }
              res.json({ feed: result });
            });
          } else {
            return res.status(403).json({ message: 'Invalid user role' });
          }

        }
}

module.exports = JournalController;
