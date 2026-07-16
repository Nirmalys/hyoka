import axios from "axios";

const getAjaxUrl = () => {
    const ajaxUrl = window?.hyokaData?.ajaxUrl;
    if (typeof ajaxUrl === "string" && ajaxUrl !== "") {
        return ajaxUrl;
    }

    console.error("Hyoka: hyokaData.ajaxUrl is missing.");
    return "";
};

const axiosClient = axios.create({
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
    },
    transformRequest: [(data) => {
        if (data instanceof FormData || data instanceof URLSearchParams) {
            return data;
        }
        const formData = new URLSearchParams();
        Object.keys(data).forEach((key) => {
            const val = data[key];
            if (val === undefined || val === null) {
                formData.append(key, '');
            } else if (typeof val === 'boolean' || typeof val === 'number') {
                formData.append(key, String(val));
            } else {
                formData.append(key, val);
            }
        });
        return formData;
    }]
});

axiosClient.interceptors.request.use(
    (config) => {
        config.baseURL = getAjaxUrl();

        const nonce = window?.hyokaData?.nonce || '';

        if (!nonce) {
            console.warn('Hyoka: Security nonce is missing');
        }

        const addNonce = (data) => {
            if (!data) return { _ajax_nonce: nonce };

            if (data instanceof FormData) {
                const action = data.get('action');
                if (action !== 'upload-attachment' && action !== 'delete-post') {
                    if (!data.has('_ajax_nonce')) data.append('_ajax_nonce', nonce);
                }
                return data;
            }

            if (data instanceof URLSearchParams) {
                const action = data.get('action');
                if (action !== 'upload-attachment' && action !== 'delete-post') {
                    if (!data.has('_ajax_nonce')) data.append('_ajax_nonce', nonce);
                }
                return data;
            }

            if (typeof data === "object") {
                if (data.action !== "upload-attachment" && data.action !== "delete-post") {
                    data._ajax_nonce = nonce;
                }
                return data;
            }

            return data;
        };

        config.data = addNonce(config.data);

        return config;
    },
    (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        console.error('AJAX Error:', {
            url: error.config?.baseURL,
            action: error.config?.data?.get ? error.config.data.get('action') : error.config?.data?.action,
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.message
        });
        return Promise.reject(error);
    }
);
export default axiosClient;