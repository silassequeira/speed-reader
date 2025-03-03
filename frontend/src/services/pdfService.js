import axios from 'axios';

const uploadPDF = async (file) => {
    const formData = new FormData();
    formData.append('pdf', file);

    try {
        const response = await axios.post('http://localhost:3000/upload-pdf', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};

export default uploadPDF;