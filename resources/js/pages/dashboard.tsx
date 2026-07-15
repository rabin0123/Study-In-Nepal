import { Head } from '@inertiajs/react';


export default function Dashboard() {
    return (
        <>
            <Head title="Dashboard" />
            
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
