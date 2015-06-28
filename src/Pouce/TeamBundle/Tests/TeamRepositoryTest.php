<?php

namespace Pouce\TeamBundle\Tests\Repository;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class TeamRespositoryTest extends WebTestCase {
    private $repo;

    public function setUp() {
        $kernel = static::createKernel();
        $kernel->boot();
        $this->repo = $kernel
            ->getContainer()
            ->get('doctrine.orm.entity_manager')
            ->getRepository('PouceTeamBundle:Team')
        ;
    }
}