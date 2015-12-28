<?php

namespace Pouce\UserBundle\EventListener;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use FOS\UserBundle\Event\UserEvent;
use FOS\UserBundle\FOSUserEvents;

class UserRegistrationListener implements EventSubscriberInterface
{
    public static function getSubscribedEvents()
    {
        return array(
            FOSUserEvents::REGISTRATION_INITIALIZE => 'onRegistrationInit',
        );
    }

    /**
     * take action when registration is initialized
     * set the username to a unique id
     * @param \FOS\UserBundle\Event\FormEvent $event
     */
    public function onRegistrationInit(UserEvent $userevent)
    {
        $user = $userevent->getUser();
        $user->setUsername(uniqid());
    }
}
