import { useState } from 'react';
import internshipService from '../../../../services/internshipService'; // Adjusted import path
import { message } from 'antd';

const useFormActions = () => {
    const [loading, setLoading] = useState(false);

    const submitForm = async (formData) => {
        setLoading(true);
        try {
            await internshipService.submitData(formData);
            message.success('Form submitted successfully!');
        } catch (error) {
            message.error('Error submitting form!');
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        submitForm,
    };
};

export default useFormActions;