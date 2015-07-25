<?php
// src/Acme/MainBundle/Menu/MenuBuilder.php

namespace Pouce\SiteBundle\Menu;

use Knp\Menu\FactoryInterface;
use Symfony\Component\DependencyInjection\ContainerAware;

class MenuBuilder extends ContainerAware
{
    public function mainMenu(FactoryInterface $factory, array $options)
    {
        $menu = $factory->createItem('root');
        $menu->setChildrenAttribute('class', 'right hide-on-med-and-down');
        $menu->addChild('Le Pouce d\'Or')->setAttribute('dropdown', true);
        $menu['Le Pouce d\'Or']->addChild('L\'association', array('uri' => '#'));
        $menu['Le Pouce d\'Or']->addChild('Règles', array('uri' => '#'));
        $menu->addChild('Edition 2015', array('route' => 'pouce_site_regles'));
        $menu->addChild('Archives', array('route' => 'pouce_site_archives'));
        $menu->addChild('Top 25', array('route' => 'pouce_site_records'));

        return $menu;
    }

    public function mobileMenu(FactoryInterface $factory, array $options)
    {
        $menu = $factory->createItem('root');
        $menu->setChildrenAttribute('id', 'nav-mobile');
        $menu->setChildrenAttribute('class', 'side-nav');
        $menu->addChild('Le Pouce d\'Or', array('route' => 'pouce_site_homepage'));
        $menu->addChild('Edition 2015', array('route' => 'pouce_site_regles'));
        $menu->addChild('Archives', array('route' => 'pouce_site_archives'));
        $menu->addChild('Top 25', array('route' => 'pouce_site_records'));

        return $menu;
    }
}