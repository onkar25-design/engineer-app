import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import Select from 'react-select';
import { Form, Button, Alert } from 'react-bootstrap';
import './UpdateEngineer.css';
import companyLogo from './company-logo.png';

const UpdateTicketForm = () => {
  const [engineerOptions, setEngineerOptions] = useState([]);
  const [selectedEngineer, setSelectedEngineer] = useState(null);
  const [ticketOptions, setTicketOptions] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [updateData, setUpdateData] = useState({
    company_branch: '',
    paused: false,
    completed: false,
    note: '',
    note_created_at: '', // Add note_created_at field
    image_urls: [],
  });
  const [alert, setAlert] = useState({ show: false, message: '', variant: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchEngineers = async () => {
      const { data, error } = await supabase.from('engineers').select('name');

      if (error) {
        console.error('Error fetching engineers:', error);
      } else {
        setEngineerOptions(
          data.map((engineer) => ({
            value: engineer.name,
            label: engineer.name,
          }))
        );
      }
    };

    fetchEngineers();
  }, []);

  useEffect(() => {
    if (selectedEngineer) {
      const fetchTickets = async () => {
        const { data, error } = await supabase
          .from('ticket_main')
          .select('ticket_number, company_branch')
          .ilike('engineer', `%${selectedEngineer.value.trim()}%`)
          .order('ticket_number', { ascending: false });

        if (error) {
          console.error('Error fetching tickets:', error);
        } else {
          setTicketOptions(
            data.map((ticket) => ({
              value: ticket.ticket_number,
              label: `${ticket.ticket_number} - ${ticket.company_branch}`,
            }))
          );
        }
      };

      fetchTickets();
    }
  }, [selectedEngineer]);

  useEffect(() => {
    if (selectedTicket) {
      const fetchTicketDetails = async () => {
        const { data, error } = await supabase
          .from('ticket_main')
          .select('*')
          .eq('ticket_number', selectedTicket.value)
          .single();

        if (error) {
          console.error('Error fetching ticket details:', error);
        } else {
          setUpdateData({
            company_branch: data.company_branch,
            paused: data.paused,
            completed: data.completed,
            note: data.note || '',
            note_created_at: data.note_created_at || '', // Fetch note_created_at
            image_urls: data.callreports ? data.callreports.split(',') : [],
          });
        }
      };

      fetchTicketDetails();
    }
  }, [selectedTicket]);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  const handleRemoveFile = (fileName) => {
    setImageFiles((prevFiles) => prevFiles.filter((file) => file.name !== fileName));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    let urls = [];
    if (imageFiles.length > 0) {
      try {
        for (const file of imageFiles) {
          const fileName = `${Date.now()}-${file.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('call-reports')
            .upload(fileName, file);

          if (uploadError) {
            throw new Error(uploadError.message);
          }

          const { data: publicData, error: publicUrlError } = await supabase.storage
            .from('call-reports')
            .getPublicUrl(fileName);

          if (publicUrlError) {
            throw new Error(publicUrlError.message);
          }

          urls.push(decodeURIComponent(publicData.publicUrl));
        }
      } catch (error) {
        console.error('Error uploading images:', error.message);
        setAlert({ show: true, message: 'Error uploading images', variant: 'danger' });
        setIsLoading(false);
        return;
      }
    }

    const combinedImageUrls = [...updateData.image_urls, ...urls];
    const imageUrlsString = combinedImageUrls.join(',');

    const dataToUpdate = {
      company_branch: updateData.company_branch,
      paused: updateData.paused,
      completed: updateData.completed,
      note: updateData.note,
      callreports: imageUrlsString,
      note_created_at: updateData.note && !updateData.note_created_at
        ? new Date().toISOString() // Set note_created_at if note is added
        : updateData.note_created_at
    };

    try {
      const { data, error } = await supabase
        .from('ticket_main')
        .update(dataToUpdate)
        .eq('ticket_number', selectedTicket.value);

      if (error) {
        throw new Error(error.message);
      }

      setAlert({
        show: true,
        message: 'Ticket updated successfully',
        variant: 'success',
      });
      setImageFiles([]);
      // Reset form fields after submission
      setSelectedTicket(null);
      setUpdateData({
        company_branch: '',
        paused: false,
        completed: false,
        note: '',
        note_created_at: '',
        image_urls: [],
      });
    } catch (error) {
      setAlert({
        show: true,
        message: `Error updating ticket: ${error.message}`,
        variant: 'danger',
      });
      console.error('Error updating ticket:', error);
    }

    setIsLoading(false);
  };

  const handleRemoveImage = (index) => {
    setUpdateData((prevData) => {
      const newImageUrls = prevData.image_urls.filter((_, i) => i !== index);
      return {
        ...prevData,
        image_urls: newImageUrls,
      };
    });
  };

  const handleDeleteTicket = async () => {
    if (!selectedTicket) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('ticket_main')
        .delete()
        .eq('ticket_number', selectedTicket.value);

      if (error) {
        throw new Error(error.message);
      }

      setAlert({
        show: true,
        message: 'Ticket deleted successfully',
        variant: 'success',
      });
      setSelectedTicket(null);
      setImageFiles([]);
      setUpdateData({
        company_branch: '',
        paused: false,
        completed: false,
        note: '',
        note_created_at: '',
        image_urls: [],
      });
    } catch (error) {
      setAlert({
        show: true,
        message: `Error deleting ticket: ${error.message}`,
        variant: 'danger',
      });
      console.error('Error deleting ticket:', error);
    }

    setIsLoading(false);
  };

  return (
    <div className="update-ticket-form">
      <img src={companyLogo} alt="Company Logo" className="company-logo-UpdateTicketForm" />
      <h2>Update Ticket</h2>
      {alert.show && (
        <Alert
          variant={alert.variant}
          onClose={() => setAlert({ show: false, message: '', variant: '' })}
          dismissible
        >
          {alert.message}
        </Alert>
      )}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="engineerSelect">
          <Form.Label className="updateform-headings">Select Engineer</Form.Label>
          <Select
            options={engineerOptions}
            value={selectedEngineer}
            onChange={(option) => setSelectedEngineer(option)}
            placeholder="Select an engineer"
          />
        </Form.Group>

        {selectedEngineer && (
          <Form.Group className="mb-3" controlId="ticketSelect">
            <Form.Label className="updateform-headings">Select Ticket</Form.Label>
            <Select
              options={ticketOptions}
              value={selectedTicket}
              onChange={(option) => setSelectedTicket(option)}
              placeholder="Select a ticket"
            />
          </Form.Group>
        )}

        {selectedTicket && (
          <>
            <Form.Group className="mb-3" controlId="company_branch">
              <Form.Label className="updateform-headings">Company Branch</Form.Label>
              <Form.Control
                type="text"
                name="company_branch"
                value={updateData.company_branch}
                onChange={(e) => setUpdateData({ ...updateData, company_branch: e.target.value })}
              />
            </Form.Group>

            {/* Note Field */}
            <Form.Group className="mb-3" controlId="note">
              <Form.Label className="updateform-headings">Note</Form.Label>
              <Form.Control
                as="textarea"
                name="note"
                rows={3}
                value={updateData.note}
                onChange={(e) => setUpdateData({ ...updateData, note: e.target.value })}
              />
              {updateData.note_created_at && (
                <Form.Text className="text-muted">
                  Note created at: {new Date(updateData.note_created_at).toLocaleString()}
                </Form.Text>
              )}
            </Form.Group>

            <Form.Group className="form-group toggle-group">
              <Form.Label className="updateform-headings me-3">Paused</Form.Label>
              <div
                className={`toggle-switch ${updateData.paused ? 'active' : ''}`}
                onClick={() => setUpdateData({ ...updateData, paused: !updateData.paused })}
              >
                <div className="slider"></div>
              </div>
              <Form.Label className="updateform-headings">Completed</Form.Label>
              <div
                className={`toggle-switch ${updateData.completed ? 'active' : ''}`}
                onClick={() => setUpdateData({ ...updateData, completed: !updateData.completed })}
              >
                <div className="slider"></div>
              </div>
            </Form.Group>

            <Form.Group className="mb-3" controlId="fileUpload">
              <Form.Label className="updateform-headings">Upload Images</Form.Label>
              <Form.Control type="file" multiple onChange={handleFileChange} />
              <div className="selected-images-grid">
                {imageFiles.map((file, index) => (
                  <div className="image-container" key={index}>
                    <span className="remove-image" onClick={() => handleRemoveFile(file.name)}>×</span>
                    <img src={URL.createObjectURL(file)} alt={`Selected file ${index + 1}`} className="selected-image" />
                  </div>
                ))}
              </div>
            </Form.Group>

            <Form.Group className="mb-3" controlId="existingImages">
              <Form.Label className="updateform-headings">Ticket Related Images</Form.Label>
              <div className="existing-images-grid">
                {updateData.image_urls.map((url, index) => (
                  <div className="image-container" key={index}>
                    <span className="remove-image" onClick={() => handleRemoveImage(index)}>×</span>
                    <img src={url} alt={`Existing image ${index + 1}`} className="existing-image" />
                  </div>
                ))}
              </div>
            </Form.Group>

            <div className="form-actions">
              <Button
                type="submit"
                className="save-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                className="delete-btn"
                onClick={handleDeleteTicket}
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete Ticket'}
              </Button>
            </div>
          </>
        )}
      </Form>
    </div>
  );
};

export default UpdateTicketForm;
