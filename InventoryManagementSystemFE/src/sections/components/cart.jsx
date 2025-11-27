import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import config from 'config';
// react-bootstrap
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import Image from 'react-bootstrap/Image';
import Nav from 'react-bootstrap/Nav';
import Stack from 'react-bootstrap/Stack';

// project-imports
import MainCard from 'components/MainCard';
import SimpleBarScroll from 'components/third-party/SimpleBar';
import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';

// assets
import Img1 from 'assets/images/user/avatar-1.png';
import Img2 from 'assets/images/user/avatar-2.png';
import Img3 from 'assets/images/user/avatar-3.png';
import Img4 from 'assets/images/user/avatar-4.png';
import Img5 from 'assets/images/user/avatar-5.png';

const notifications = [
    {
        id: 1,
        avatar: Img1,
        time: '2 min ago',
        title: 'UI/UX Design',
        description: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
        date: 'Today'
    },
    {
        id: 2,
        avatar: Img2,
        time: '1 hour ago',
        title: 'Message',
        description: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
        date: 'Today'
    },
    {
        id: 3,
        avatar: Img3,
        time: '2 hour ago',
        title: 'Forms',
        description: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
        date: 'Yesterday'
    },
    {
        id: 4,
        avatar: Img4,
        time: '12 hour ago',
        title: 'Challenge invitation',
        description: 'Jonny aber invites you to join the challenge',
        actions: true,
        date: 'Yesterday'
    },
    {
        id: 5,
        avatar: Img5,
        time: '5 hour ago',
        title: 'Security',
        description: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
        date: 'Yesterday'
    }
];


export default function Cart() {

    return (
        <div>
            {/* CART NOTIF */}


            <Dropdown.Header className="d-flex align-items-center justify-content-between">
                <h5 className="m-0">Cart</h5>
                <Link className="btn btn-link btn-sm" to="#">
                    Remove All
                </Link>
            </Dropdown.Header>

            <SimpleBarScroll style={{ maxHeight: 'calc(100vh - 215px)' }}>
                <div className="dropdown-body text-wrap position-relative">
                    {notifications.map((notification, index) => (
                        <React.Fragment key={notification.id}>
                            {index === 0 || notifications[index - 1].date !== notification.date ? (
                                <p className="text-span">{notification.date}</p>
                            ) : null}
                            <MainCard className="mb-0">
                                <Stack direction="horizontal" gap={3}>
                                    <Image className="img-radius avatar rounded-0" src={notification.avatar} alt="Generic placeholder image" />
                                    <div>
                                        <span className="float-end text-sm text-muted">{notification.time}</span>
                                        <h5 className="text-body mb-2">{notification.title}</h5>
                                        <p className="mb-0">{notification.description}</p>
                                        {notification.actions && (
                                            <div className="mt-2">
                                                <Button variant="outline-secondary" size="sm" className="me-2">
                                                    Decline
                                                </Button>
                                                <Button variant="primary" size="sm">
                                                    Accept
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </Stack>
                            </MainCard>
                        </React.Fragment>
                    ))}
                </div>
            </SimpleBarScroll>

            <div className="text-center py-2">
                <Link to="#!" className="link-danger">
                    Clear all Notifications
                </Link>
            </div>




        </div>
    )
}